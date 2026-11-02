package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.OrderStatusRequest;
import com.example.PawConnect.dto.request.commerce.CheckoutItemRequest;
import com.example.PawConnect.dto.request.commerce.CheckoutRequest;
import com.example.PawConnect.dto.response.OrderItemResponse;
import com.example.PawConnect.dto.response.OrderResponse;
import com.example.PawConnect.exception.*;
import com.example.PawConnect.mapper.OrderMapper;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.service.OrderService;
import jakarta.persistence.criteria.Predicate;
import com.example.PawConnect.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.PawConnect.dto.response.ShippingLabelResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import com.example.PawConnect.model.PromoCode;
import com.example.PawConnect.repository.PromoCodeRepository;
import com.example.PawConnect.service.PromoCodeService;

@Slf4j
@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final NotificationService notificationService;
    private final OrderMapper orderMapper;
    private final com.example.PawConnect.service.AuditLogService auditLogService;
    private final PaymentService paymentService;
    private final PaymentOrderRepository paymentOrderRepository;
    private final ProductImageRepository productImageRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final PromoCodeService promoCodeService;

    @org.springframework.beans.factory.annotation.Value("${app.payment.window-minutes:15}")
    private int paymentWindowMinutes = 15;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            AddressRepository addressRepository,
            UserRepository userRepository,
            PlatformSettingRepository platformSettingRepository,
            NotificationService notificationService,
            OrderMapper orderMapper,
            com.example.PawConnect.service.AuditLogService auditLogService,
            @Lazy PaymentService paymentService,
            PaymentOrderRepository paymentOrderRepository,
            ProductImageRepository productImageRepository,
            PromoCodeRepository promoCodeRepository,
            PromoCodeService promoCodeService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.notificationService = notificationService;
        this.orderMapper = orderMapper;
        this.auditLogService = auditLogService;
        this.paymentService = paymentService;
        this.paymentOrderRepository = paymentOrderRepository;
        this.productImageRepository = productImageRepository;
        this.promoCodeRepository = promoCodeRepository;
        this.promoCodeService = promoCodeService;
    }

    private static final Set<String> ALLOWED_ORDER_SORT_FIELDS = Set.of(
            "id", "orderNo", "createdAt", "totalAmount", "orderStatus", "paymentStatus"
    );
    private static final int MAX_PAGE_SIZE = 100;

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_ORDER_SORT_FIELDS.contains(order.getProperty())) {
                throw new BusinessRuleException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), ALLOWED_ORDER_SORT_FIELDS
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }

    @Override
    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 1. Read customer's active cart or resolve by explicitly provided cartId
        Cart cart = null;
        if (request.getCartId() != null) {
            cart = cartRepository.findById(request.getCartId())
                    .filter(c -> c.getUser().getId().equals(userId))
                    .orElse(null);
        }
        if (cart == null) {
            cart = cartRepository.findTopByUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE)
                    .orElse(null);
        }
        if (cart == null) {
            cart = cartRepository.save(Cart.builder()
                    .user(user)
                    .status(CartStatus.ACTIVE)
                    .build());
        }

        List<CartItem> cartItems = new ArrayList<>(cartItemRepository.findByCartId(cart.getId()));

        // Auto-populate / synchronize active cart if DB cart is empty but items were passed from client
        if (cartItems.isEmpty() && request.getItems() != null && !request.getItems().isEmpty()) {
            for (CheckoutItemRequest itemReq : request.getItems()) {
                if (itemReq.getProductId() != null && itemReq.getQuantity() != null && itemReq.getQuantity() > 0) {
                    Product product = productRepository.findById(itemReq.getProductId())
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

                    CartItem newItem = CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(itemReq.getQuantity())
                            .unitPrice(product.getPrice())
                            .build();
                    cartItems.add(cartItemRepository.save(newItem));
                }
            }
        }

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout an empty shopping cart");
        }

        // 2. Validate delivery address ownership
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + request.getAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: delivery address does not belong to the authenticated user");
        }

        // 3. Validate product availability and stock
        // Sort items by product ID to prevent deadlock during concurrent multi-row inventory updates
        List<CartItem> sortedItems = new ArrayList<>(cartItems);
        sortedItems.sort(Comparator.comparing(item -> item.getProduct().getId()));

        for (CartItem item : sortedItems) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProduct().getId()));

            if (!Boolean.TRUE.equals(product.getIsActive()) || product.getStatus() != ProductStatus.ACTIVE) {
                throw new BusinessRuleException(String.format("Product '%s' is no longer active or available for purchase", product.getName()));
            }

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new BusinessRuleException("Invalid quantity in cart item");
            }

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new InsufficientStockException(String.format(
                        "Product '%s' has insufficient stock (%d available, %d requested)",
                        product.getName(), product.getStockQuantity(), item.getQuantity()
                ));
            }
        }

        // Idempotent Checkout Reuse (Prevent Duplicate Unpaid Orders & Multiple Stock Deductions):
        // If customer already has an active, non-expired OrderStatus.PENDING order, check if we can reuse it
        // or cancel it cleanly (restoring stock and promo usage) before creating a new order.
        List<Order> existingPendingOrders = orderRepository.findByUserIdAndOrderStatus(userId, OrderStatus.PENDING);
        for (Order pendingOrder : existingPendingOrders) {
            // Lazy check if expired (support paymentExpiresAt and legacy orders where paymentExpiresAt was null)
            boolean isExpired = false;
            if (pendingOrder.getPaymentExpiresAt() != null) {
                isExpired = pendingOrder.getPaymentExpiresAt().isBefore(java.time.Instant.now());
            } else {
                LocalDateTime refTime = pendingOrder.getPlacedAt() != null ? pendingOrder.getPlacedAt() : pendingOrder.getCreatedAt();
                if (refTime != null) {
                    isExpired = refTime.plusMinutes(paymentWindowMinutes).isBefore(LocalDateTime.now());
                }
            }

            if (isExpired) {
                expireSingleOrder(pendingOrder);
                continue;
            }
            boolean samePromo = (request.getPromoCode() == null && pendingOrder.getPromoCode() == null)
                    || (request.getPromoCode() != null && request.getPromoCode().trim().equalsIgnoreCase(pendingOrder.getPromoCode()));

            BigDecimal requestedShipping = request.getShippingFee() != null ? request.getShippingFee() : request.getDeliveryFee();
            boolean sameShipping = requestedShipping == null
                    || (pendingOrder.getShippingFee() != null && pendingOrder.getShippingFee().compareTo(requestedShipping) == 0);

            if (samePromo && sameShipping && isSameOrderComposition(pendingOrder, sortedItems, address)) {
                log.info("Reusing active non-expired pending order {} for user {} to prevent duplicate order / stock deduction",
                        pendingOrder.getOrderNo(), userId);
                return orderMapper.toResponse(pendingOrder);
            } else {
                cancelStalePendingOrder(pendingOrder, "Order superseded by updated checkout session");
            }
        }

        // 4. Atomic Inventory Reservation
        List<CartItem> decrementedItems = new ArrayList<>();
        for (CartItem item : sortedItems) {
            int updated = productRepository.decrementStock(item.getProduct().getId(), item.getQuantity());
            if (updated == 0) {
                // Concurrently purchased by another request before our update
                throw new InsufficientStockException(String.format(
                        "Product '%s' has insufficient stock to fulfill checkout due to concurrent purchases",
                        item.getProduct().getName()
                ));
            }
            decrementedItems.add(item);
        }

        // 5. Calculate Server-Side Financials
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : sortedItems) {
            Product product = item.getProduct();
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal configuredFee = platformSettingRepository.findBySettingKey("delivery_fee")
                .or(() -> platformSettingRepository.findBySettingKey("shipping_fee"))
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getSettingValue().trim());
                    } catch (Exception ex) {
                        return null;
                    }
                })
                .orElse(null);

        BigDecimal configuredThreshold = platformSettingRepository.findBySettingKey("free_delivery_threshold")
                .or(() -> platformSettingRepository.findBySettingKey("free_shipping_threshold"))
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getSettingValue().trim());
                    } catch (Exception ex) {
                        return null;
                    }
                })
                .orElse(new BigDecimal("500.00"));

        BigDecimal shippingFee = BigDecimal.ZERO;
        if (configuredFee != null) {
            shippingFee = configuredFee;
        } else if (request.getShippingFee() != null) {
            shippingFee = request.getShippingFee();
        } else if (request.getDeliveryFee() != null) {
            shippingFee = request.getDeliveryFee();
        }

        if (shippingFee.compareTo(BigDecimal.ZERO) < 0) {
            shippingFee = BigDecimal.ZERO;
        }

        if (configuredThreshold != null && subtotal.compareTo(configuredThreshold) >= 0) {
            shippingFee = BigDecimal.ZERO;
        }

        BigDecimal taxRate = getPlatformSettingDecimal("tax_rate", BigDecimal.ZERO);
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedPromoCode = null;

        if (request.getPromoCode() != null && !request.getPromoCode().trim().isBlank()) {
            String code = request.getPromoCode().trim().toUpperCase();
            PromoCode promo = promoCodeRepository.findByCodeForUpdate(code)
                    .orElseThrow(() -> new BusinessRuleException("Invalid promo code: " + code));

            promoCodeService.validatePromoCode(promo, userId, subtotal);
            discountAmount = promoCodeService.calculateDiscount(promo, subtotal);

            // Atomically increment used count
            promo.setUsedCount(promo.getUsedCount() + 1);
            promoCodeRepository.save(promo);
            appliedPromoCode = promo.getCode();
            log.info("Applied promo code {} with discount ₹{} to checkout for user {}", appliedPromoCode, discountAmount, userId);
        }

        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount).subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 6. Create Order with Immutable Delivery Address Snapshot
        String orderNo = "ORD-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Order order = Order.builder()
                .orderNo(orderNo)
                .user(user)
                .address(address) // Retained for foreign-key traceability
                .deliveryRecipientName(address.getRecipientName())
                .deliveryPhone(address.getPhone())
                .deliveryAddressLine1(address.getAddressLine1())
                .deliveryAddressLine2(address.getAddressLine2())
                .deliveryCity(address.getCity())
                .deliveryState(address.getState())
                .deliveryPostalCode(address.getPostalCode())
                .deliveryCountry(address.getCountry() != null ? address.getCountry() : "India")
                .deliveryLatitude(address.getLatitude())
                .deliveryLongitude(address.getLongitude())
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .taxAmount(taxAmount)
                .discountAmount(discountAmount)
                .promoCode(appliedPromoCode)
                .totalAmount(totalAmount)
                .paymentStatus(PaymentStatus.PENDING)
                .orderStatus(OrderStatus.PENDING)
                .placedAt(LocalDateTime.now())
                .paymentExpiresAt(java.time.Instant.now().plus(java.time.Duration.ofMinutes(paymentWindowMinutes)))
                .build();

        Order savedOrder = orderRepository.save(order);

        // 7. Create OrderItem Snapshots
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem item : sortedItems) {
            Product product = item.getProduct();
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

            String productImageUrl = null;
            if (product != null && product.getId() != null) {
                productImageUrl = productImageRepository.findByProductIdAndIsPrimaryTrue(product.getId())
                        .map(ProductImage::getImageUrl)
                        .orElseGet(() -> productImageRepository.findByProductId(product.getId()).stream()
                                .findFirst()
                                .map(ProductImage::getImageUrl)
                                .orElse(null));
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .productImageUrl(productImageUrl)
                    .quantity(item.getQuantity())
                    .unitPrice(product.getPrice())
                    .lineTotal(lineTotal)
                    .build();

            orderItems.add(orderItemRepository.save(orderItem));
        }
        savedOrder.setOrderItems(orderItems);

        // 8. Add Initial Status History (PENDING awaiting payment authorization)
        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(OrderStatus.PENDING)
                .changedBy(user)
                .remarks(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes() : "Order created, awaiting payment confirmation")
                .build();
        OrderStatusHistory savedHistory = orderStatusHistoryRepository.save(initialHistory);
        savedOrder.setStatusHistories(List.of(savedHistory));

        log.info("Successfully created pending order {} for user {} awaiting payment", savedOrder.getOrderNo(), userId);
        return orderMapper.toResponse(savedOrder);
    }

    private BigDecimal getPlatformSettingDecimal(String key, BigDecimal defaultValue) {
        return platformSettingRepository.findBySettingKey(key)
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getSettingValue().trim());
                    } catch (Exception ex) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Override
    @Transactional
    public PageResponse<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        Pageable sanitizedPageable = sanitizePageable(pageable);
        Page<Order> orderPage = orderRepository.findByUserId(userId, sanitizedPageable);
        orderPage.getContent().forEach(this::checkAndExpireOrderIfOverdue);
        return PageResponse.from(orderPage.map(orderMapper::toResponse));
    }

    @Override
    @Transactional
    public OrderResponse getOrderDetails(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        checkAndExpireOrderIfOverdue(order);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderItemResponse> getOrderItems(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        return items.stream().map(orderMapper::toItemResponse).toList();
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId, String reason) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        // Idempotency: if already cancelled, return existing state without duplicate stock increment
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            log.info("Order {} is already cancelled; returning existing state idempotently", orderId);
            return orderMapper.toResponse(order);
        }

        if (order.getOrderStatus() == OrderStatus.SHIPPED || order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new InvalidStateTransitionException(String.format(
                    "Cannot cancel order in '%s' status. Only orders awaiting dispatch can be cancelled.",
                    order.getOrderStatus()
            ));
        }

        // Restore reserved inventory atomically
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
            log.info("Restored {} units to product {}", item.getQuantity(), item.getProduct().getId());
        }

        if (order.getPromoCode() != null && !order.getPromoCode().isBlank()) {
            promoCodeRepository.decrementUsedCountByCodeSafely(order.getPromoCode());
            log.info("Decremented promo code {} usedCount for cancelled order {}", order.getPromoCode(), order.getId());
        }

        order.setOrderStatus(OrderStatus.CANCELLED);

        // Auto-refund paid orders or transition pending payment to FAILED
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            paymentOrderRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).ifPresent(po -> {
                if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                    try {
                        paymentService.refundPayment(po.getRazorpayOrderId(), "Order cancelled: " + (reason != null ? reason : "by customer"));
                    } catch (Exception e) {
                        log.error("Automatic refund initiation failed for order {}: {}", order.getId(), e.getMessage());
                    }
                }
            });
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        } else if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }

        Order updatedOrder = orderRepository.save(order);

        User user = userRepository.findById(order.getUser().getId()).orElse(order.getUser());
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(updatedOrder)
                .status(OrderStatus.CANCELLED)
                .changedBy(user)
                .remarks(reason != null && !reason.isBlank() ? reason : "Order cancelled by customer")
                .build();
        orderStatusHistoryRepository.save(history);

        // Notify customer
        String dedupeKey = "NOTIF-ORDER-" + updatedOrder.getId() + "-CANCELLED";
        notificationService.createNotification(
                user,
                NotificationType.ORDER_CANCELLED,
                "Order Cancelled",
                String.format("Your order %s has been cancelled successfully.", updatedOrder.getOrderNo()),
                "ORDER",
                updatedOrder.getId(),
                dedupeKey
        );

        return orderMapper.toResponse(updatedOrder);
    }

    // =========================================================================
    // Admin Operations
    // =========================================================================

    @Override
    @Transactional
    public PageResponse<OrderResponse> getAllOrders(
            OrderStatus status,
            PaymentStatus paymentStatus,
            Long userId,
            Pageable pageable
    ) {
        Pageable sanitizedPageable = sanitizePageable(pageable);

        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("orderStatus"), status));
            }
            if (paymentStatus != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Order> orderPage = orderRepository.findAll(spec, sanitizedPageable);
        orderPage.getContent().forEach(this::checkAndExpireOrderIfOverdue);
        return PageResponse.from(orderPage.map(orderMapper::toResponse));
    }

    @Override
    @Transactional
    public OrderResponse getAdminOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        checkAndExpireOrderIfOverdue(order);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatusRequest request, Long adminUserId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getOrderStatus();
        OrderStatus newStatus = request.getOrderStatus();

        // Idempotency: same status returns existing record
        if (currentStatus == newStatus) {
            log.info("Order {} is already in status {}; returning existing state", orderId, currentStatus);
            return orderMapper.toResponse(order);
        }

        // Validate lifecycle transitions
        validateStatusTransition(currentStatus, newStatus);

        // 1. Payment Guard: Block transitioning to PACKED, SHIPPED, or DELIVERED if paymentStatus is not PAID or SUCCESS
        if ((newStatus == OrderStatus.PACKED || newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED)
                && order.getPaymentStatus() != PaymentStatus.PAID && order.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new BusinessRuleException("Cannot pack or ship an unpaid order");
        }

        String effectiveNotes = request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes().trim()
                : (request.getRemarks() != null ? request.getRemarks().trim() : null);

        // 2. Transition to PACKED
        if (newStatus == OrderStatus.PACKED) {
            if (order.getPackedAt() == null) {
                order.setPackedAt(LocalDateTime.now());
            }
            if (order.getShippingLabelNumber() == null || order.getShippingLabelNumber().isBlank()) {
                order.setShippingLabelNumber("SL-PC-" + order.getId() + "-" + String.format("%04d", new Random().nextInt(10000)));
            }
            if (order.getInvoiceNumber() == null || order.getInvoiceNumber().isBlank()) {
                order.setInvoiceNumber("INV-ORD-" + order.getId());
            }
            if (request.getPackageWeightKg() != null) {
                order.setPackageWeightKg(request.getPackageWeightKg());
            } else if (order.getPackageWeightKg() == null) {
                order.setPackageWeightKg(BigDecimal.valueOf(0.50));
            }
            if (request.getPackageDimensions() != null && !request.getPackageDimensions().isBlank()) {
                order.setPackageDimensions(request.getPackageDimensions().trim());
            } else if (order.getPackageDimensions() == null || order.getPackageDimensions().isBlank()) {
                order.setPackageDimensions("25x20x15 cm");
            }
            if (request.getCourierPartner() != null && !request.getCourierPartner().isBlank()) {
                order.setCourierPartner(request.getCourierPartner().trim());
            } else if (order.getCourierPartner() == null || order.getCourierPartner().isBlank()) {
                order.setCourierPartner("PawConnect Express");
            }
            if (effectiveNotes != null && !effectiveNotes.isBlank()) {
                order.setDispatchNotes(effectiveNotes);
            }
        }

        // 3. Transition to SHIPPED
        if (newStatus == OrderStatus.SHIPPED) {
            if (order.getShippedAt() == null) {
                order.setShippedAt(LocalDateTime.now());
            }
            if (order.getPackedAt() == null) {
                order.setPackedAt(LocalDateTime.now());
            }
            if (order.getShippingLabelNumber() == null || order.getShippingLabelNumber().isBlank()) {
                order.setShippingLabelNumber("SL-PC-" + order.getId() + "-" + String.format("%04d", new Random().nextInt(10000)));
            }
            if (order.getInvoiceNumber() == null || order.getInvoiceNumber().isBlank()) {
                order.setInvoiceNumber("INV-ORD-" + order.getId());
            }
            if (request.getPackageWeightKg() != null) {
                order.setPackageWeightKg(request.getPackageWeightKg());
            } else if (order.getPackageWeightKg() == null) {
                order.setPackageWeightKg(BigDecimal.valueOf(0.50));
            }
            if (request.getPackageDimensions() != null && !request.getPackageDimensions().isBlank()) {
                order.setPackageDimensions(request.getPackageDimensions().trim());
            } else if (order.getPackageDimensions() == null || order.getPackageDimensions().isBlank()) {
                order.setPackageDimensions("25x20x15 cm");
            }
            if (request.getCourierPartner() != null && !request.getCourierPartner().isBlank()) {
                order.setCourierPartner(request.getCourierPartner().trim());
            } else if (order.getCourierPartner() == null || order.getCourierPartner().isBlank()) {
                order.setCourierPartner("PawConnect Express");
            }
            if (Boolean.TRUE.equals(request.getAutoGenerateAwb()) || (request.getTrackingNumber() == null || request.getTrackingNumber().isBlank())) {
                if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank() || Boolean.TRUE.equals(request.getAutoGenerateAwb())) {
                    order.setTrackingNumber("AWBPC" + (System.currentTimeMillis() % 100000000L));
                }
            } else {
                order.setTrackingNumber(request.getTrackingNumber().trim());
            }
            if (request.getTrackingUrl() != null && !request.getTrackingUrl().isBlank()) {
                order.setTrackingUrl(request.getTrackingUrl().trim());
            }
            if (request.getEstimatedDeliveryDate() != null) {
                order.setEstimatedDeliveryDate(request.getEstimatedDeliveryDate());
            } else if (order.getEstimatedDeliveryDate() == null) {
                order.setEstimatedDeliveryDate(LocalDate.now().plusDays(4));
            }
            if (effectiveNotes != null && !effectiveNotes.isBlank()) {
                order.setDispatchNotes(effectiveNotes);
            }
        }

        // 4. Transition to DELIVERED
        if (newStatus == OrderStatus.DELIVERED) {
            if (order.getDeliveredAt() == null) {
                order.setDeliveredAt(LocalDateTime.now());
            }
            if (effectiveNotes != null && !effectiveNotes.isBlank()) {
                order.setDispatchNotes(effectiveNotes);
            }
        }

        // If transitioning to CANCELLED by admin, restore inventory and auto-refund if paid
        if (newStatus == OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
                log.info("Admin restored {} units to product {}", item.getQuantity(), item.getProduct().getId());
            }

            if (order.getPromoCode() != null && !order.getPromoCode().isBlank()) {
                promoCodeRepository.decrementUsedCountByCodeSafely(order.getPromoCode());
                log.info("Admin restored promo code {} usedCount for cancelled order {}", order.getPromoCode(), order.getId());
            }

            // Auto-refund paid orders or transition pending payment to FAILED
            if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                paymentOrderRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).ifPresent(po -> {
                    if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                        try {
                            paymentService.refundPayment(po.getRazorpayOrderId(), "Order cancelled by admin");
                        } catch (Exception e) {
                            log.error("Admin automatic refund failed for order {}: {}", order.getId(), e.getMessage());
                        }
                    }
                });
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            } else if (order.getPaymentStatus() == PaymentStatus.PENDING) {
                order.setPaymentStatus(PaymentStatus.FAILED);
            }
        }

        order.setOrderStatus(newStatus);
        Order updated = orderRepository.save(order);

        User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(updated)
                .status(newStatus)
                .changedBy(adminUser)
                .remarks(effectiveNotes != null ? effectiveNotes : "Status updated by admin to " + newStatus)
                .build();
        orderStatusHistoryRepository.save(history);

        // Determine notification type and rich message
        NotificationType notifType = switch (newStatus) {
            case PACKED -> NotificationType.ORDER_PACKED;
            case SHIPPED -> NotificationType.ORDER_SHIPPED;
            case DELIVERED -> NotificationType.ORDER_DELIVERED;
            case CANCELLED -> NotificationType.ORDER_CANCELLED;
            default -> NotificationType.ORDER_CONFIRMED;
        };

        String notifTitle = switch (newStatus) {
            case PACKED -> "Order Packed & Labeled";
            case SHIPPED -> "Order Shipped - " + updated.getOrderNo();
            case DELIVERED -> "Order Delivered - " + updated.getOrderNo();
            case CANCELLED -> "Order Cancelled";
            default -> "Order Status Updated: " + newStatus.name();
        };

        String notifMessage = switch (newStatus) {
            case PACKED -> String.format(
                    "Your order %s has been packed and prepared for courier dispatch.\n\n" +
                    "Shipping Label Ref: %s\n" +
                    "Courier Partner: %s\n" +
                    "Estimated Delivery: %s%s",
                    updated.getOrderNo(),
                    updated.getShippingLabelNumber() != null ? updated.getShippingLabelNumber() : "SL-PC-" + updated.getId(),
                    updated.getCourierPartner() != null ? updated.getCourierPartner() : "PawConnect Express",
                    updated.getEstimatedDeliveryDate() != null ? updated.getEstimatedDeliveryDate().toString() : "4-5 business days",
                    updated.getDispatchNotes() != null && !updated.getDispatchNotes().isBlank() ? "\nWarehouse Notes: " + updated.getDispatchNotes() : ""
            );
            case SHIPPED -> String.format(
                    "Your order %s has been dispatched and is on its way!\n\n" +
                    "AWB Tracking Number: %s\n" +
                    "Shipping Label Ref: %s\n" +
                    "Courier Partner: %s\n" +
                    "Estimated Delivery: %s%s",
                    updated.getOrderNo(),
                    updated.getTrackingNumber() != null ? updated.getTrackingNumber() : "Pending",
                    updated.getShippingLabelNumber() != null ? updated.getShippingLabelNumber() : "SL-PC-" + updated.getId(),
                    updated.getCourierPartner() != null ? updated.getCourierPartner() : "PawConnect Express",
                    updated.getEstimatedDeliveryDate() != null ? updated.getEstimatedDeliveryDate().toString() : "4-5 business days",
                    updated.getDispatchNotes() != null && !updated.getDispatchNotes().isBlank() ? "\nDispatch Notes: " + updated.getDispatchNotes() : ""
            );
            case DELIVERED -> String.format(
                    "Your order %s has been delivered successfully. Thank you for choosing PawConnect!\n\n" +
                    "Delivered On: %s\n" +
                    "Courier Partner: %s\n" +
                    "AWB Tracking Number: %s%s",
                    updated.getOrderNo(),
                    updated.getDeliveredAt() != null ? updated.getDeliveredAt().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) : "Today",
                    updated.getCourierPartner() != null ? updated.getCourierPartner() : "PawConnect Express",
                    updated.getTrackingNumber() != null ? updated.getTrackingNumber() : "N/A",
                    updated.getDispatchNotes() != null && !updated.getDispatchNotes().isBlank() ? "\nProof of Delivery (POD) Note: " + updated.getDispatchNotes() : ""
            );
            case CANCELLED -> String.format("Your order %s has been cancelled.", updated.getOrderNo());
            default -> String.format("Your order %s status has been updated to %s.", updated.getOrderNo(), newStatus.name());
        };

        String dedupeKey = "NOTIF-ORDER-" + updated.getId() + "-" + newStatus.name();
        User customer = userRepository.findById(updated.getUser().getId()).orElse(updated.getUser());
        notificationService.createNotification(
                customer,
                notifType,
                notifTitle,
                notifMessage,
                "ORDER",
                updated.getId(),
                dedupeKey
        );

        // Audit log
        String oldSnapshot = "{\"orderStatus\":\"" + currentStatus + "\"}";
        String newSnapshot = "{\"orderStatus\":\"" + newStatus + "\",\"courierPartner\":\"" + (updated.getCourierPartner() != null ? updated.getCourierPartner() : "") + "\",\"trackingNumber\":\"" + (updated.getTrackingNumber() != null ? updated.getTrackingNumber() : "") + "\"}";
        auditLogService.logAction(
                "ORDER_STATUS_UPDATED",
                "ORDERS",
                "ORDER",
                updated.getId(),
                oldSnapshot,
                newSnapshot
        );

        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ShippingLabelResponse getShippingLabel(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Ensure key shipping fields are initialized for valid printable shift label
        boolean needsUpdate = false;
        if (order.getShippingLabelNumber() == null || order.getShippingLabelNumber().isBlank()) {
            order.setShippingLabelNumber("SL-PC-" + order.getId() + "-" + String.format("%04d", new Random().nextInt(10000)));
            needsUpdate = true;
        }
        if (order.getInvoiceNumber() == null || order.getInvoiceNumber().isBlank()) {
            order.setInvoiceNumber("INV-ORD-" + order.getId());
            needsUpdate = true;
        }
        if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank()) {
            order.setTrackingNumber("AWBPC" + (System.currentTimeMillis() % 100000000L));
            needsUpdate = true;
        }
        if (order.getCourierPartner() == null || order.getCourierPartner().isBlank()) {
            order.setCourierPartner("PawConnect Express");
            needsUpdate = true;
        }
        if (order.getPackageWeightKg() == null) {
            order.setPackageWeightKg(BigDecimal.valueOf(0.50));
            needsUpdate = true;
        }
        if (order.getPackageDimensions() == null || order.getPackageDimensions().isBlank()) {
            order.setPackageDimensions("25x20x15 cm");
            needsUpdate = true;
        }
        if (order.getEstimatedDeliveryDate() == null) {
            order.setEstimatedDeliveryDate(LocalDate.now().plusDays(4));
            needsUpdate = true;
        }
        if (needsUpdate) {
            order = orderRepository.save(order);
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
        List<ShippingLabelResponse.ShippingLabelItemResponse> itemResponses = orderItems.stream()
                .map(it -> ShippingLabelResponse.ShippingLabelItemResponse.builder()
                        .sku(it.getProductSku() != null ? it.getProductSku() : (it.getProduct() != null ? it.getProduct().getSku() : "SKU-" + it.getId()))
                        .productName(it.getProductName() != null ? it.getProductName() : (it.getProduct() != null ? it.getProduct().getName() : "Item"))
                        .quantity(it.getQuantity())
                        .unitPrice(it.getUnitPrice())
                        .build())
                .toList();

        int totalItemsCount = orderItems.stream().mapToInt(OrderItem::getQuantity).sum();

        String line2 = order.getDeliveryAddressLine2() != null && !order.getDeliveryAddressLine2().isBlank()
                ? order.getDeliveryAddressLine2().trim() + ", "
                : "";
        String fullAddress = String.format("%s, %s%s, %s - %s, %s",
                order.getDeliveryAddressLine1() != null ? order.getDeliveryAddressLine1().trim() : "",
                line2,
                order.getDeliveryCity() != null ? order.getDeliveryCity().trim() : "",
                order.getDeliveryState() != null ? order.getDeliveryState().trim() : "",
                order.getDeliveryPostalCode() != null ? order.getDeliveryPostalCode().trim() : "",
                order.getDeliveryCountry() != null ? order.getDeliveryCountry().trim() : "India"
        ).replaceAll("^[ ,]+|[ ,]+$", "");

        String shipFrom = "PawConnect Central Fulfillment Center, Salt Lake Sector V, Kolkata, WB - 700091, India | GSTIN: 19AABCP1234C1Z5 | Phone: +91-33-4000-1234";

        return ShippingLabelResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNo())
                .invoiceNumber(order.getInvoiceNumber())
                .shippingLabelNumber(order.getShippingLabelNumber())
                .awbNumber(order.getTrackingNumber())
                .courierPartner(order.getCourierPartner())
                .paymentMode("PREPAID")
                .orderDate(order.getPlacedAt() != null ? order.getPlacedAt() : order.getCreatedAt())
                .packedAt(order.getPackedAt())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .packageWeightKg(order.getPackageWeightKg())
                .packageDimensions(order.getPackageDimensions())
                .totalItemsCount(totalItemsCount)
                .declaredValue(order.getTotalAmount())
                .shipFrom(shipFrom)
                .recipientName(order.getDeliveryRecipientName())
                .phone(order.getDeliveryPhone())
                .fullAddress(fullAddress)
                .city(order.getDeliveryCity())
                .state(order.getDeliveryState())
                .postalCode(order.getDeliveryPostalCode())
                .country(order.getDeliveryCountry())
                .items(itemResponses)
                .build();
    }

    @Override
    @Transactional
    public List<ShippingLabelResponse> getBulkShippingLabels(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<ShippingLabelResponse> labels = new ArrayList<>();
        for (Long id : orderIds) {
            if (id == null) continue;
            try {
                labels.add(getShippingLabel(id));
            } catch (Exception ex) {
                log.warn("Could not generate shipping label for order {}: {}", id, ex.getMessage());
            }
        }
        return labels;
    }

    @Override
    public com.example.PawConnect.dto.response.BatchOrderStatusResponse batchUpdateOrderStatus(
            com.example.PawConnect.dto.request.admin.BatchOrderStatusRequest request,
            Long adminUserId
    ) {
        List<Long> orderIds = request.getOrderIds();
        if (orderIds == null || orderIds.isEmpty()) {
            return com.example.PawConnect.dto.response.BatchOrderStatusResponse.builder()
                    .totalRequested(0)
                    .updatedCount(0)
                    .skippedCount(0)
                    .updatedOrderIds(Collections.emptyList())
                    .skippedReasons(Collections.emptyList())
                    .build();
        }

        List<Long> updated = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (Long orderId : orderIds) {
            if (orderId == null) continue;
            try {
                OrderStatusRequest singleReq = new OrderStatusRequest();
                singleReq.setOrderStatus(request.getOrderStatus());
                singleReq.setRemarks(request.getRemarks());
                singleReq.setNotes(request.getNotes());
                singleReq.setCourierPartner(request.getCourierPartner());
                updateOrderStatus(orderId, singleReq, adminUserId);
                updated.add(orderId);
            } catch (Exception e) {
                log.warn("Skipping order {} in batch update: {}", orderId, e.getMessage());
                skipped.add("Order #" + orderId + ": " + e.getMessage());
            }
        }

        return com.example.PawConnect.dto.response.BatchOrderStatusResponse.builder()
                .totalRequested(orderIds.size())
                .updatedCount(updated.size())
                .skippedCount(skipped.size())
                .updatedOrderIds(updated)
                .skippedReasons(skipped)
                .build();
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.DELIVERED) {
            throw new InvalidStateTransitionException("Cannot change status of a DELIVERED order");
        }
        if (current == OrderStatus.CANCELLED) {
            throw new InvalidStateTransitionException("Cannot change status of a CANCELLED order");
        }

        boolean valid = switch (current) {
            case PENDING -> (next == OrderStatus.CONFIRMED || next == OrderStatus.PACKED || next == OrderStatus.CANCELLED);
            case CONFIRMED -> (next == OrderStatus.PACKED || next == OrderStatus.CANCELLED);
            case PACKED -> (next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED);
            case SHIPPED -> (next == OrderStatus.DELIVERED);
            default -> false;
        };

        if (!valid) {
            throw new InvalidStateTransitionException(String.format(
                    "Invalid order status transition from %s to %s", current, next
            ));
        }
    }

    @Override
    @Transactional
    public void expireOverduePendingOrders() {
        java.time.Instant now = java.time.Instant.now();
        List<Order> overdueOrders = orderRepository.findByOrderStatusAndPaymentStatusInAndPaymentExpiresAtBefore(
                OrderStatus.PENDING,
                List.of(PaymentStatus.PENDING, PaymentStatus.CREATED, PaymentStatus.FAILED),
                now
        );
        for (Order order : overdueOrders) {
            expireSingleOrder(order);
        }
    }

    @Override
    @Transactional
    public OrderResponse expireOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        if (order.getOrderStatus() == OrderStatus.PENDING
                && (order.getPaymentStatus() == PaymentStatus.PENDING || order.getPaymentStatus() == PaymentStatus.CREATED || order.getPaymentStatus() == PaymentStatus.FAILED)) {
            expireSingleOrder(order);
        }
        return orderMapper.toResponse(order);
    }

    public boolean checkAndExpireOrderIfOverdue(Order order) {
        if (order == null) return false;
        if (order.getOrderStatus() == OrderStatus.PENDING
                && (order.getPaymentStatus() == PaymentStatus.PENDING
                || order.getPaymentStatus() == PaymentStatus.CREATED
                || order.getPaymentStatus() == PaymentStatus.FAILED)
                && order.getPaymentExpiresAt() != null
                && java.time.Instant.now().isAfter(order.getPaymentExpiresAt())) {
            expireSingleOrder(order);
            return true;
        }
        return false;
    }

    private void expireSingleOrder(Order order) {
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
                    log.info("Restored {} units of product {} upon expiry of order {}",
                            item.getQuantity(), item.getProduct().getId(), order.getOrderNo());
                }
            }
        }

        if (order.getPromoCode() != null && !order.getPromoCode().isBlank()) {
            promoCodeRepository.decrementUsedCountByCodeSafely(order.getPromoCode());
            log.info("Restored promo code {} usedCount on expiry of order {}", order.getPromoCode(), order.getOrderNo());
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .changedBy(order.getUser())
                .remarks("Order automatically cancelled: Payment was not completed within the 15-minute payment window.")
                .changedAt(LocalDateTime.now())
                .build();
        orderStatusHistoryRepository.save(history);

        failUnsuccessfulPaymentAttempts(order, "15-minute payment window expired");
        orderRepository.save(order);

        try {
            User targetUser = order.getUser() != null && order.getUser().getId() != null
                    ? userRepository.findById(order.getUser().getId()).orElse(order.getUser())
                    : order.getUser();
            notificationService.createNotification(
                    targetUser,
                    NotificationType.ORDER_CANCELLED,
                    "Order Cancelled — Payment Window Expired",
                    String.format("Payment window of 15 minutes expired for order %s. Reserved items have been released.", order.getOrderNo()),
                    "ORDER",
                    order.getId(),
                    "NOTIF-ORDER-" + order.getId() + "-EXPIRED"
            );
        } catch (Exception ex) {
            log.warn("Failed to dispatch order expiration notification for order {}: {}", order.getId(), ex.getMessage());
        }
    }

    private void cancelStalePendingOrder(Order order, String reason) {
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
                    log.info("Restored {} units of product {} from cancelled stale pending order {}",
                            item.getQuantity(), item.getProduct().getId(), order.getOrderNo());
                }
            }
        }

        if (order.getPromoCode() != null && !order.getPromoCode().isBlank()) {
            promoCodeRepository.decrementUsedCountByCodeSafely(order.getPromoCode());
            log.info("Restored promo code {} usedCount from cancelled stale pending order {}", order.getPromoCode(), order.getOrderNo());
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .changedBy(order.getUser())
                .remarks(reason)
                .changedAt(LocalDateTime.now())
                .build();
        orderStatusHistoryRepository.save(history);

        failUnsuccessfulPaymentAttempts(order, reason);
        orderRepository.save(order);
    }

    private void failUnsuccessfulPaymentAttempts(Order order, String reason) {
        if (order.getId() == null) {
            return;
        }

        List<PaymentOrder> attempts = paymentOrderRepository.findAllByOrderId(order.getId());
        List<PaymentOrder> failedAttempts = new ArrayList<>();
        for (PaymentOrder attempt : attempts) {
            if (attempt.getStatus() != PaymentStatus.PAID && attempt.getStatus() != PaymentStatus.SUCCESS) {
                attempt.setStatus(PaymentStatus.FAILED);
                attempt.setFailureReason(reason);
                failedAttempts.add(attempt);
            }
        }
        if (!failedAttempts.isEmpty()) {
            paymentOrderRepository.saveAll(failedAttempts);
        }
    }

    private boolean isSameOrderComposition(Order pendingOrder, List<CartItem> sortedItems, Address address) {
        if (pendingOrder.getAddress() == null || address == null || !pendingOrder.getAddress().getId().equals(address.getId())) {
            return false;
        }
        List<OrderItem> orderItems = pendingOrder.getOrderItems();
        if (orderItems == null || orderItems.size() != sortedItems.size()) {
            return false;
        }
        Map<Long, Integer> pendingCounts = new HashMap<>();
        for (OrderItem oi : orderItems) {
            if (oi.getProduct() == null) return false;
            pendingCounts.put(oi.getProduct().getId(), oi.getQuantity());
        }
        for (CartItem ci : sortedItems) {
            if (ci.getProduct() == null) return false;
            Integer qty = pendingCounts.get(ci.getProduct().getId());
            if (qty == null || !qty.equals(ci.getQuantity())) {
                return false;
            }
        }
        return true;
    }
}
