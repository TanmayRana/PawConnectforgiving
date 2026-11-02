package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.payment.CreateOrderRequestDTO;
import com.example.PawConnect.dto.request.payment.CreatePaymentOrderRequest;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequest;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequestDTO;
import com.example.PawConnect.dto.response.PaymentOrderResponseDTO;
import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.dto.response.RazorpayOrderResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.PaymentVerificationException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.PaymentMapper;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final RazorpayService razorpayService;
    private final AuthorizationService authorizationService;
    private final CurrentUserService currentUserService;
    private final PaymentMapper paymentMapper;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderService orderService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            PaymentOrderRepository paymentOrderRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            ServiceBookingRepository serviceBookingRepository,
            OrderRepository orderRepository,
            NotificationService notificationService,
            RazorpayService razorpayService,
            AuthorizationService authorizationService,
            CurrentUserService currentUserService,
            PaymentMapper paymentMapper,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            OrderItemRepository orderItemRepository,
            @org.springframework.context.annotation.Lazy OrderService orderService
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentOrderRepository = paymentOrderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.serviceBookingRepository = serviceBookingRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.razorpayService = razorpayService;
        this.authorizationService = authorizationService;
        this.currentUserService = currentUserService;
        this.paymentMapper = paymentMapper;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderService = orderService;
    }

    // =========================================================================
    // Standard Razorpay Checkout Architecture
    // =========================================================================

    @Override
    @Transactional
    public PaymentOrderResponseDTO createOrder(CreateOrderRequestDTO request, Long authenticatedUserId) {
        if (authenticatedUserId == null) {
            authenticatedUserId = currentUserService.getCurrentUserId();
        }
        final Long resolvedUserId = authenticatedUserId;
        User user = userRepository.findById(resolvedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + resolvedUserId));

        long amountInPaise;
        Long productId = request.getProductId();
        Long orderId = request.getOrderId();
        Long bookingId = request.getBookingId();
        String bookingType = request.getBookingType();
        String receipt = request.getReceipt();
        if (receipt == null || receipt.isBlank()) {
            receipt = "RCPT-" + System.currentTimeMillis() % 100000000;
        }

        Map<String, String> notes = request.getNotes() != null ? new HashMap<>(request.getNotes()) : new HashMap<>();
        notes.put("userId", user.getId().toString());

        if (productId != null) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));
            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new BusinessRuleException("Product is currently unavailable for purchase");
            }
            int quantity = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;
            BigDecimal unitPrice = product.getPrice();
            BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(quantity));
            amountInPaise = total.multiply(BigDecimal.valueOf(100)).longValue();
            notes.put("itemType", "PRODUCT");
            notes.put("productId", productId.toString());
            notes.put("productName", product.getName());
            notes.put("quantity", String.valueOf(quantity));
        } else if (orderId != null) {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
            if (!currentUserService.hasRole("ADMIN") && !order.getUser().getId().equals(resolvedUserId)) {
                throw new ForbiddenException("Access denied: you do not own this order");
            }
            if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                throw new BusinessRuleException("Order #" + order.getOrderNo() + " has already been paid");
            }

            // Lazy Expiry Check for 15-Minute Payment Window
            if (order.getPaymentExpiresAt() != null && java.time.Instant.now().isAfter(order.getPaymentExpiresAt())) {
                orderService.expireOrder(orderId);
                throw new BusinessRuleException("Payment window of 15 minutes has expired. Please place a new order.");
            }
            if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                throw new BusinessRuleException("Cannot retry payment for cancelled order #" + order.getOrderNo() + ". Please place a new order.");
            }

            amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
            notes.put("itemType", "ORDER");
            notes.put("orderId", orderId.toString());
            notes.put("orderNo", order.getOrderNo());
        } else if (bookingId != null) {
            if ("VETERINARY".equalsIgnoreCase(bookingType)) {
                Appointment appointment = appointmentRepository.findById(bookingId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + bookingId));
                if (!currentUserService.hasRole("ADMIN") && !appointment.getPet().getOwner().getId().equals(resolvedUserId)) {
                    throw new ForbiddenException("Access denied: you do not own this appointment");
                }
                if (appointment.getPaymentExpiresAt() != null && java.time.Instant.now().isAfter(appointment.getPaymentExpiresAt())) {
                    appointment.setStatus(com.example.PawConnect.model.AppointmentStatus.CANCELLED);
                    appointmentRepository.save(appointment);
                    throw new BusinessRuleException("Payment window of 15 minutes has expired. Please place a new appointment.");
                }
                amountInPaise = appointment.getConsultationFee().multiply(BigDecimal.valueOf(100)).longValue();
                notes.put("itemType", "VETERINARY_APPOINTMENT");
                notes.put("bookingId", bookingId.toString());
            } else {
                ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                        .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with ID: " + bookingId));
                if (!currentUserService.hasRole("ADMIN") && !booking.getPet().getOwner().getId().equals(resolvedUserId)) {
                    throw new ForbiddenException("Access denied: you do not own this service booking");
                }
                if (booking.getPaymentExpiresAt() != null && java.time.Instant.now().isAfter(booking.getPaymentExpiresAt())) {
                    booking.setStatus(com.example.PawConnect.model.BookingStatus.CANCELLED);
                    serviceBookingRepository.save(booking);
                    throw new BusinessRuleException("Payment window of 15 minutes has expired. Please place a new service booking.");
                }
                amountInPaise = booking.getPrice().multiply(BigDecimal.valueOf(100)).longValue();
                notes.put("itemType", "SERVICE_BOOKING");
                notes.put("bookingId", bookingId.toString());
            }
        } else {
            throw new BusinessRuleException("Invalid payment order request: productId, orderId, or bookingId is required");
        }

        if (amountInPaise <= 0) {
            throw new BusinessRuleException("Calculated order amount must be greater than zero");
        }

        java.time.Instant paymentExpiresAt = null;
        if (orderId != null) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null) {
                paymentExpiresAt = order.getPaymentExpiresAt();
            }
        } else if (bookingId != null) {
            if ("VETERINARY".equalsIgnoreCase(bookingType)) {
                Appointment appointment = appointmentRepository.findById(bookingId).orElse(null);
                if (appointment != null) paymentExpiresAt = appointment.getPaymentExpiresAt();
            } else {
                ServiceBooking booking = serviceBookingRepository.findById(bookingId).orElse(null);
                if (booking != null) paymentExpiresAt = booking.getPaymentExpiresAt();
            }
        }
        if (paymentExpiresAt == null) {
            paymentExpiresAt = java.time.Instant.now().plus(java.time.Duration.ofMinutes(15));
        }

        String currency = (request.getCurrency() != null && !request.getCurrency().isBlank()) ? request.getCurrency().trim().toUpperCase() : "INR";
        String razorpayOrderId = razorpayService.createOrder(amountInPaise, currency, receipt, notes);

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .razorpayOrderId(razorpayOrderId)
                .userId(user.getId())
                .productId(productId)
                .orderId(orderId)
                .bookingId(bookingId)
                .bookingType(bookingType)
                .amountInPaise(amountInPaise)
                .currency(currency)
                .status(PaymentStatus.CREATED)
                .paymentExpiresAt(paymentExpiresAt)
                .signatureVerified(false)
                .build();

        PaymentOrder saved = paymentOrderRepository.save(paymentOrder);
        log.info("Created standard PaymentOrder {} (Razorpay: {}, expiresAt: {}) for user {}",
                saved.getId(), razorpayOrderId, paymentExpiresAt, user.getId());

        Long remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), paymentExpiresAt).getSeconds());
        boolean canRetry = java.time.Instant.now().isBefore(paymentExpiresAt);

        return PaymentOrderResponseDTO.builder()
                .orderId(razorpayOrderId)
                .razorpayOrderId(razorpayOrderId)
                .amountInPaise(amountInPaise)
                .currency(currency)
                .keyId(razorpayService.getKeyId())
                .paymentOrderId(saved.getId())
                .productId(productId)
                .orderIdReference(orderId)
                .bookingId(bookingId)
                .status(saved.getStatus().name())
                .signatureVerified(false)
                .paymentExpiresAt(paymentExpiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PaymentOrderResponseDTO verifyPaymentSignature(VerifyPaymentRequestDTO request) {
        if (request == null || request.getRazorpayPaymentId() == null || request.getRazorpayPaymentId().isBlank()) {
            throw new PaymentVerificationException("Razorpay payment ID is required for verification");
        }

        String razorpayOrderId = request.getRazorpayOrderId();
        String razorpayPaymentId = request.getRazorpayPaymentId();
        String razorpaySignature = request.getRazorpaySignature();

        PaymentOrder paymentOrder = null;
        if (razorpayOrderId != null && !razorpayOrderId.isBlank()) {
            paymentOrder = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseGet(() -> paymentRepository.findByGatewayOrderId(razorpayOrderId)
                            .map(lp -> {
                                PaymentOrder created = PaymentOrder.builder()
                                        .razorpayOrderId(lp.getGatewayOrderId())
                                        .userId(lp.getUser().getId())
                                        .orderId(lp.getPaymentFor() == PaymentFor.ORDER ? lp.getReferenceId() : null)
                                        .bookingId(lp.getPaymentFor() != PaymentFor.ORDER ? lp.getReferenceId() : null)
                                        .bookingType(lp.getPaymentFor() != null ? lp.getPaymentFor().name() : null)
                                        .amountInPaise(lp.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
                                        .currency(lp.getCurrency() != null ? lp.getCurrency() : "INR")
                                        .status(PaymentStatus.CREATED)
                                        .signatureVerified(false)
                                        .build();
                                return paymentOrderRepository.save(created);
                            })
                            .orElse(null));
        }

        // Primary: Cryptographic HMAC-SHA256 signature verification if signature & orderId present
        boolean validSignature = false;
        if (razorpayOrderId != null && !razorpayOrderId.isBlank() && razorpaySignature != null && !razorpaySignature.isBlank()) {
            validSignature = razorpayService.verifyPaymentSignature(
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature
            );
        }

        if (validSignature && paymentOrder != null) {
            paymentOrder.setSignatureVerified(true);
            paymentOrder.setRazorpayPaymentId(razorpayPaymentId);
            paymentOrderRepository.save(paymentOrder);

            PaymentOrder fulfilled = fulfillOrderIdempotently(paymentOrder.getRazorpayOrderId(), razorpayPaymentId);
            return toPaymentOrderResponse(fulfilled);
        }

        // Secondary / Fallback: Verify payment directly with Razorpay gateway API server-to-server
        log.info("HMAC signature missing or order mismatch for payment {}. Initiating server-to-server gateway verification.", razorpayPaymentId);
        com.razorpay.Payment gatewayPayment = razorpayService.fetchPayment(razorpayPaymentId);
        if (gatewayPayment == null) {
            log.warn("Payment verification failed: Razorpay payment {} not found on gateway", razorpayPaymentId);
            if (paymentOrder != null) {
                paymentOrder.setStatus(PaymentStatus.FAILED);
                paymentOrder.setFailureReason("Cryptographic signature mismatch and gateway payment not found");
                paymentOrderRepository.save(paymentOrder);
            }
            throw new PaymentVerificationException("Razorpay payment verification failed: payment not found on gateway");
        }

        Object statusObj = gatewayPayment.has("status") ? gatewayPayment.get("status") : null;
        String paymentStatus = (statusObj != null && !JSONObject.NULL.equals(statusObj))
                ? statusObj.toString() : "";
        long gatewayAmountInPaise = 0L;
        Object amtObj = gatewayPayment.has("amount") ? gatewayPayment.get("amount") : null;
        if (amtObj != null && !JSONObject.NULL.equals(amtObj)) {
            if (amtObj instanceof Number n) {
                gatewayAmountInPaise = n.longValue();
            } else {
                try {
                    gatewayAmountInPaise = Long.parseLong(amtObj.toString());
                } catch (Exception ignored) {}
            }
        }

        if (!"captured".equals(paymentStatus) && !"authorized".equals(paymentStatus)) {
            log.warn("Razorpay payment {} is in invalid state: {}", razorpayPaymentId, paymentStatus);
            throw new PaymentVerificationException("Payment verification failed: payment is " + paymentStatus);
        }

        // Auto-capture if authorized
        if ("authorized".equals(paymentStatus)) {
            boolean captured = razorpayService.capturePayment(razorpayPaymentId, gatewayAmountInPaise);
            log.info("Authorized payment {} capture result: {}", razorpayPaymentId, captured);
        }

        // Locate or create PaymentOrder
        if (paymentOrder == null) {
            Object orderIdObj = gatewayPayment.has("order_id") ? gatewayPayment.get("order_id") : null;
            String linkedOrderId = (orderIdObj != null && !JSONObject.NULL.equals(orderIdObj))
                    ? orderIdObj.toString() : null;
            if (linkedOrderId != null && !linkedOrderId.isBlank()) {
                paymentOrder = paymentOrderRepository.findByRazorpayOrderId(linkedOrderId).orElse(null);
            }
        }

        if (paymentOrder != null && paymentOrder.getAmountInPaise() != null && gatewayAmountInPaise > 0) {
            if (gatewayAmountInPaise < paymentOrder.getAmountInPaise()) {
                log.warn("Security rejection: Payment {} received {} paise but PaymentOrder {} requires {} paise",
                        razorpayPaymentId, gatewayAmountInPaise, paymentOrder.getRazorpayOrderId(), paymentOrder.getAmountInPaise());
                throw new PaymentVerificationException("Payment amount paid on gateway is less than the required order amount");
            }
        }

        if (paymentOrder == null) {
            // Find user's pending order or booking
            Long currentUserId = currentUserService.getCurrentUserId();
            if (currentUserId != null) {
                List<Order> userOrders = orderRepository.findByUserId(currentUserId);
                Order matchedOrder = userOrders.stream()
                        .filter(o -> o.getPaymentStatus() == PaymentStatus.PENDING)
                        .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                        .findFirst()
                        .orElse(null);

                if (matchedOrder != null) {
                    long requiredPaise = matchedOrder.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
                    if (gatewayAmountInPaise < requiredPaise) {
                        log.warn("Security rejection: Payment {} received {} paise but Order #{} requires {} paise",
                                razorpayPaymentId, gatewayAmountInPaise, matchedOrder.getId(), requiredPaise);
                        throw new PaymentVerificationException("Payment amount paid on gateway is less than the required order amount");
                    }

                    String synthOrderId = "order_rec_" + razorpayPaymentId.replace("pay_", "");
                    PaymentOrder created = PaymentOrder.builder()
                            .razorpayOrderId(synthOrderId)
                            .razorpayPaymentId(razorpayPaymentId)
                            .userId(currentUserId)
                            .orderId(matchedOrder.getId())
                            .amountInPaise(gatewayAmountInPaise)
                            .currency("INR")
                            .status(PaymentStatus.CREATED)
                            .signatureVerified(true)
                            .build();
                    paymentOrder = paymentOrderRepository.save(created);
                    log.info("Reconciled standalone payment {} to customer Order #{}", razorpayPaymentId, matchedOrder.getId());
                }
            }
        }

        if (paymentOrder == null) {
            throw new PaymentVerificationException("Payment is confirmed on gateway but cannot be matched to a pending order");
        }

        paymentOrder.setSignatureVerified(true);
        paymentOrder.setRazorpayPaymentId(razorpayPaymentId);
        paymentOrderRepository.save(paymentOrder);

        PaymentOrder fulfilled = fulfillOrderIdempotently(paymentOrder.getRazorpayOrderId(), razorpayPaymentId);
        return toPaymentOrderResponse(fulfilled);
    }

    @Override
    @Transactional
    public void handleWebhook(String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("Webhook request missing X-Razorpay-Signature header");
            throw new PaymentVerificationException("Missing Razorpay webhook signature header");
        }

        // Verify the raw JSON string against razorpay.webhook.secret using Utils.verifyWebhookSignature
        boolean validSignature = razorpayService.verifyWebhookSignature(rawBody, signatureHeader);
        if (!validSignature) {
            log.warn("Invalid Razorpay webhook signature");
            throw new PaymentVerificationException("Invalid Razorpay webhook signature");
        }

        JSONObject root = new JSONObject(rawBody);
        String event = root.optString("event");
        JSONObject payloadObj = root.optJSONObject("payload");

        if (payloadObj == null) {
            log.warn("Webhook event {} contains empty payload object", event);
            return;
        }

        String orderId = null;
        String paymentId = null;
        String failureReason = null;

        JSONObject paymentObj = payloadObj.optJSONObject("payment");
        if (paymentObj != null) {
            JSONObject paymentEntity = paymentObj.optJSONObject("entity");
            if (paymentEntity != null) {
                orderId = paymentEntity.optString("order_id", null);
                paymentId = paymentEntity.optString("id", null);
                failureReason = paymentEntity.optString("error_description", null);
            }
        }

        if (orderId == null) {
            JSONObject orderObj = payloadObj.optJSONObject("order");
            if (orderObj != null) {
                JSONObject orderEntity = orderObj.optJSONObject("entity");
                if (orderEntity != null) {
                    orderId = orderEntity.optString("id", null);
                }
            }
        }

        JSONObject refundObj = payloadObj.optJSONObject("refund");
        if (refundObj != null) {
            JSONObject refundEntity = refundObj.optJSONObject("entity");
            if (refundEntity != null) {
                if (orderId == null) {
                    orderId = refundEntity.optString("order_id", null);
                }
                if (paymentId == null) {
                    paymentId = refundEntity.optString("payment_id", null);
                }
            }
        }

        if ((orderId == null || orderId.isBlank()) && paymentId != null) {
            final String lookupPaymentId = paymentId;
            orderId = paymentOrderRepository.findByRazorpayPaymentId(lookupPaymentId)
                    .map(PaymentOrder::getRazorpayOrderId)
                    .orElseGet(() -> paymentRepository.findByGatewayPaymentId(lookupPaymentId)
                            .map(Payment::getGatewayOrderId)
                            .orElse(null));
        }

        if (orderId == null || orderId.isBlank()) {
            log.info("Webhook event {} does not contain an order ID; acknowledged without update", event);
            return;
        }

        if ("payment.captured".equals(event) || "order.paid".equals(event)) {
            fulfillOrderIdempotently(orderId, paymentId);
            log.info("Webhook {} reconciled order {} to PAID", event, orderId);
        } else if ("payment.failed".equals(event)) {
            final String finalOrderId = orderId;
            final String finalFailureReason = failureReason;
            paymentOrderRepository.findByRazorpayOrderIdForUpdate(orderId).ifPresent(order -> {
                if (order.getStatus() == PaymentStatus.PAID || order.getStatus() == PaymentStatus.SUCCESS) {
                    log.warn("Refusing to downgrade already PAID order {} upon payment.failed event", finalOrderId);
                    return;
                }
                order.setStatus(PaymentStatus.FAILED);
                order.setFailureReason(finalFailureReason != null ? finalFailureReason : "Payment failed at gateway");
                paymentOrderRepository.save(order);
                log.info("Webhook marked PaymentOrder {} as FAILED", finalOrderId);

                if (order.getOrderId() != null) {
                    orderRepository.findById(order.getOrderId()).ifPresent(ord -> {
                        if (ord.getPaymentExpiresAt() != null && java.time.Instant.now().isAfter(ord.getPaymentExpiresAt())) {
                            orderService.expireOrder(ord.getId());
                        } else {
                            log.info("Order {} payment failed, but within payment window until {}. Preserving PENDING status.",
                                    ord.getOrderNo(), ord.getPaymentExpiresAt());
                        }
                    });
                }
            });

            paymentRepository.findByGatewayOrderIdForUpdate(orderId).ifPresent(lp -> {
                if (lp.getStatus() != PaymentStatus.SUCCESS && lp.getStatus() != PaymentStatus.PAID) {
                    lp.setStatus(PaymentStatus.FAILED);
                    lp.setFailureReason(finalFailureReason != null ? finalFailureReason : "Payment failed at gateway");
                    paymentRepository.save(lp);
                }
            });
        } else if ("refund.processed".equals(event)) {
            try {
                refundPayment(orderId, "Webhook refund.processed event");
                log.info("Webhook refund.processed reconciled order {} to REFUNDED", orderId);
            } catch (Exception e) {
                log.warn("Webhook refund.processed reconciliation failed for order {}: {}", orderId, e.getMessage());
            }
        } else {
            log.info("Ignoring unsupported webhook event: {}", event);
        }
    }

    @Override
    @Transactional
    public PaymentOrder fulfillOrderIdempotently(String razorpayOrderId, String razorpayPaymentId) {
        // Pessimistic write lock serializes concurrent execution between /verify and /webhook
        PaymentOrder order = paymentOrderRepository.findByRazorpayOrderIdForUpdate(razorpayOrderId).orElse(null);
        Payment legacyPayment = paymentRepository.findByGatewayOrderIdForUpdate(razorpayOrderId).orElse(null);

        if ((order != null && (order.getStatus() == PaymentStatus.PAID || order.getStatus() == PaymentStatus.SUCCESS))
                || (legacyPayment != null && (legacyPayment.getStatus() == PaymentStatus.PAID || legacyPayment.getStatus() == PaymentStatus.SUCCESS))) {
            log.info("Payment for Razorpay order {} was already fulfilled; returning existing record", razorpayOrderId);
            return order;
        }

        Long ordId = order != null ? order.getOrderId() : null;
        Long bkId = order != null ? order.getBookingId() : null;
        String bkType = order != null ? order.getBookingType() : null;

        if (legacyPayment != null) {
            if (ordId == null && legacyPayment.getPaymentFor() == PaymentFor.ORDER) {
                ordId = legacyPayment.getReferenceId();
            }
            if (bkId == null && legacyPayment.getPaymentFor() != PaymentFor.ORDER) {
                bkId = legacyPayment.getReferenceId();
                bkType = legacyPayment.getPaymentFor() == PaymentFor.APPOINTMENT ? "VETERINARY" : "SERVICE_BOOKING";
            }

            legacyPayment.setStatus(PaymentStatus.SUCCESS);
            if (razorpayPaymentId != null && !razorpayPaymentId.isBlank()) {
                legacyPayment.setGatewayPaymentId(razorpayPaymentId);
            }
            legacyPayment.setGatewayStatus("captured");
            legacyPayment.setPaidAt(LocalDateTime.now());
            legacyPayment.setCapturedAt(LocalDateTime.now());
            legacyPayment = paymentRepository.save(legacyPayment);
        }

        if (order != null) {
            order.setStatus(PaymentStatus.PAID);
            order.setSignatureVerified(true);
            if (razorpayPaymentId != null && !razorpayPaymentId.isBlank()) {
                order.setRazorpayPaymentId(razorpayPaymentId);
            }
            order = paymentOrderRepository.save(order);
            log.info("Marked PaymentOrder {} as PAID with payment ID {}", order.getId(), razorpayPaymentId);
        } else if (legacyPayment != null) {
            order = PaymentOrder.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .razorpayPaymentId(razorpayPaymentId)
                    .userId(legacyPayment.getUser().getId())
                    .orderId(ordId)
                    .bookingId(bkId)
                    .bookingType(bkType)
                    .amountInPaise(legacyPayment.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
                    .currency(legacyPayment.getCurrency() != null ? legacyPayment.getCurrency() : "INR")
                    .status(PaymentStatus.PAID)
                    .signatureVerified(true)
                    .build();
            order = paymentOrderRepository.save(order);
        }

        final Payment finalizedPayment = legacyPayment;

        // Fulfill application business logic
        // 1. Merchandise Order fulfillment
        if (ordId != null) {
            orderRepository.findById(ordId).ifPresent(ord -> {
                ord.setOrderStatus(OrderStatus.CONFIRMED);
                ord.setPaymentStatus(PaymentStatus.PAID);
                orderRepository.save(ord);

                OrderStatusHistory history = OrderStatusHistory.builder()
                        .order(ord)
                        .status(OrderStatus.CONFIRMED)
                        .remarks("Payment verified via Razorpay (" + (razorpayPaymentId != null ? razorpayPaymentId : "verified") + ")")
                        .changedAt(LocalDateTime.now())
                        .build();
                orderStatusHistoryRepository.save(history);

                // Clear customer's active cart now that payment is confirmed
                if (ord.getUser() != null) {
                    cartRepository.findTopByUserIdAndStatusOrderByUpdatedAtDesc(ord.getUser().getId(), CartStatus.ACTIVE).ifPresent(activeCart -> {
                        cartItemRepository.deleteByCartId(activeCart.getId());
                        activeCart.setStatus(CartStatus.CONVERTED);
                        cartRepository.save(activeCart);
                    });
                }

                String invoiceNum = ord.getInvoiceNumber() != null && !ord.getInvoiceNumber().isBlank()
                        ? ord.getInvoiceNumber()
                        : "INV-ORD-" + ord.getId();
                if (ord.getInvoiceNumber() == null || ord.getInvoiceNumber().isBlank()) {
                    ord.setInvoiceNumber(invoiceNum);
                    orderRepository.save(ord);
                }

                String pMethod = (finalizedPayment != null && finalizedPayment.getPaymentMethod() != null)
                        ? finalizedPayment.getPaymentMethod()
                        : "Razorpay Online";
                BigDecimal grandTotal = ord.getTotalAmount() != null ? ord.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal subtotal = ord.getSubtotal() != null
                        ? ord.getSubtotal()
                        : grandTotal.multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(118), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal totalTax = grandTotal.subtract(subtotal).max(BigDecimal.ZERO);

                String dedupeKey = "NOTIF-ORDER-" + ord.getId() + "-PAID";
                String invoiceReceiptMsg = String.format(
                        "Payment for order %s received and verified successfully.\n\n" +
                        "Tax Invoice Number: %s\n" +
                        "Razorpay Payment ID: %s\n" +
                        "Payment Method: %s\n" +
                        "Subtotal: ₹%.2f\n" +
                        "GST (CGST 9%% + SGST 9%%): ₹%.2f\n" +
                        "Grand Total Paid: ₹%.2f",
                        ord.getOrderNo(),
                        invoiceNum,
                        razorpayPaymentId != null ? razorpayPaymentId : "N/A",
                        pMethod,
                        subtotal.doubleValue(),
                        totalTax.doubleValue(),
                        grandTotal.doubleValue()
                );

                notificationService.createNotification(
                        ord.getUser(),
                        NotificationType.PAYMENT_SUCCESS,
                        "Payment Successful & Tax Invoice - " + ord.getOrderNo(),
                        invoiceReceiptMsg,
                        "ORDER",
                        ord.getId(),
                        dedupeKey
                );

                String dedupeKeyConf = "NOTIF-ORDER-" + ord.getId() + "-CONFIRMED";
                notificationService.createNotification(
                        ord.getUser(),
                        NotificationType.ORDER_CREATED,
                        "Order Confirmed",
                        String.format("Your order %s has been confirmed and is being processed.", ord.getOrderNo()),
                        "ORDER",
                        ord.getId(),
                        dedupeKeyConf
                );
            });
        }

        // 2. Appointment / Booking fulfillment
        final Payment finalLegacyPayment = legacyPayment;
        if (bkId != null) {
            if ("VETERINARY".equalsIgnoreCase(bkType)) {
                appointmentRepository.findById(bkId).ifPresent(apt -> {
                    apt.setStatus(AppointmentStatus.CONFIRMED);
                    if (finalLegacyPayment != null && apt.getPayment() == null) {
                        apt.setPayment(finalLegacyPayment);
                    }
                    appointmentRepository.save(apt);
                    User owner = (apt.getPet() != null) ? apt.getPet().getOwner() : null;
                    if (owner != null) {
                        String dedupeKey = "NOTIF-PAYMENT-APT-" + apt.getId() + "-SUCCESS";
                        notificationService.createNotification(
                                owner,
                                NotificationType.PAYMENT_SUCCESS,
                                "Appointment Payment Successful",
                                String.format("Payment for appointment %s received successfully.", apt.getAppointmentNo()),
                                "APPOINTMENT",
                                apt.getId(),
                                dedupeKey
                        );
                        String dedupeKeyConf = "NOTIF-APT-" + apt.getId() + "-CONFIRMED";
                        notificationService.createNotification(
                                owner,
                                NotificationType.BOOKING_CONFIRMED,
                                "Appointment Confirmed",
                                String.format("Your appointment %s is confirmed.", apt.getAppointmentNo()),
                                "APPOINTMENT",
                                apt.getId(),
                                dedupeKeyConf
                        );
                    }
                });
            } else if ("SERVICE".equalsIgnoreCase(bkType) || "SERVICE_BOOKING".equalsIgnoreCase(bkType)) {
                serviceBookingRepository.findById(bkId).ifPresent(sb -> {
                    sb.setStatus(BookingStatus.CONFIRMED);
                    if (finalLegacyPayment != null && sb.getPayment() == null) {
                        sb.setPayment(finalLegacyPayment);
                    }
                    serviceBookingRepository.save(sb);
                    User owner = (sb.getPet() != null) ? sb.getPet().getOwner() : null;
                    if (owner != null) {
                        String dedupeKey = "NOTIF-PAYMENT-SB-" + sb.getId() + "-SUCCESS";
                        notificationService.createNotification(
                                owner,
                                NotificationType.PAYMENT_SUCCESS,
                                "Service Booking Payment Successful",
                                String.format("Payment for booking %s received successfully.", sb.getBookingNo()),
                                "SERVICE_BOOKING",
                                sb.getId(),
                                dedupeKey
                        );
                        String dedupeKeyConf = "NOTIF-SB-" + sb.getId() + "-CONFIRMED";
                        notificationService.createNotification(
                                owner,
                                NotificationType.BOOKING_CONFIRMED,
                                "Service Booking Confirmed",
                                String.format("Your service booking %s is confirmed.", sb.getBookingNo()),
                                "SERVICE_BOOKING",
                                sb.getId(),
                                dedupeKeyConf
                        );
                    }
                });
            }
        }

        // 3. Keep legacy Payment table synchronized if only PaymentOrder was used
        if (legacyPayment == null && order != null) {
            try {
                PaymentFor pFor = PaymentFor.ORDER;
                Long refId = ordId;
                if (bkId != null) {
                    pFor = "VETERINARY".equalsIgnoreCase(bkType) ? PaymentFor.APPOINTMENT : PaymentFor.SERVICE_BOOKING;
                    refId = bkId;
                }
                User payUser = null;
                if (order.getUserId() != null) {
                    payUser = userRepository.findById(order.getUserId()).orElse(null);
                }
                if (payUser != null) {
                    Payment newPayment = Payment.builder()
                            .user(payUser)
                            .paymentReference("PAY-" + (razorpayPaymentId != null ? razorpayPaymentId : order.getRazorpayOrderId()))
                            .paymentFor(pFor)
                            .referenceId(refId != null ? refId : 0L)
                            .amount(BigDecimal.valueOf(order.getAmountInPaise()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP))
                            .paymentMethod("RAZORPAY")
                            .transactionId(razorpayPaymentId)
                            .status(PaymentStatus.SUCCESS)
                            .gatewayProvider("RAZORPAY")
                            .gatewayOrderId(razorpayOrderId)
                            .gatewayPaymentId(razorpayPaymentId)
                            .currency(order.getCurrency())
                            .gatewayStatus("captured")
                            .paidAt(LocalDateTime.now())
                            .capturedAt(LocalDateTime.now())
                            .build();
                    paymentRepository.save(newPayment);
                }
            } catch (Exception ex) {
                log.warn("Legacy payment synchronization notice: {}", ex.getMessage());
            }
        }

        return order;
    }

    @Override
    @Transactional
    public void cancelAbandonedPayment(String razorpayOrderId, Long authenticatedUserId) {
        if (authenticatedUserId == null) {
            authenticatedUserId = currentUserService.getCurrentUserId();
        }
        final Long resolvedUserId = authenticatedUserId;

        PaymentOrder paymentOrder = paymentOrderRepository.findByRazorpayOrderIdForUpdate(razorpayOrderId)
                .orElse(null);
        if (paymentOrder == null) {
            log.warn("cancelAbandonedPayment: PaymentOrder not found for {}", razorpayOrderId);
            return;
        }

        if (paymentOrder.getUserId() != null && !paymentOrder.getUserId().equals(resolvedUserId) && !currentUserService.hasRole("ADMIN")) {
            throw new ForbiddenException("You are not authorized to cancel this payment order");
        }

        if (paymentOrder.getStatus() == PaymentStatus.PAID || paymentOrder.getStatus() == PaymentStatus.SUCCESS) {
            log.warn("Cannot cancel already paid payment order {}", razorpayOrderId);
            return;
        }

        paymentOrder.setStatus(PaymentStatus.FAILED);
        paymentOrder.setFailureReason("Checkout abandoned or dismissed by customer");
        paymentOrderRepository.save(paymentOrder);

        // If linked to an Order
        if (paymentOrder.getOrderId() != null) {
            orderRepository.findById(paymentOrder.getOrderId()).ifPresent(order -> {
                boolean isWithinWindow = order.getPaymentExpiresAt() != null
                        && java.time.Instant.now().isBefore(order.getPaymentExpiresAt());

                if (isWithinWindow) {
                    log.info("Order {} payment dismissed, but within 15-minute retry window. Preserving PENDING order.",
                            order.getOrderNo());
                } else {
                    orderService.expireOrder(order.getId());
                }
            });
        }

        // If linked to an Appointment that is still PENDING
        if (paymentOrder.getBookingId() != null && "VETERINARY".equalsIgnoreCase(paymentOrder.getBookingType())) {
            appointmentRepository.findById(paymentOrder.getBookingId()).ifPresent(apt -> {
                if (apt.getStatus() == AppointmentStatus.PENDING) {
                    apt.setStatus(AppointmentStatus.CANCELLED);
                    appointmentRepository.save(apt);
                }
            });
        }

        // If linked to a ServiceBooking that is still PENDING
        if (paymentOrder.getBookingId() != null && ("SERVICE".equalsIgnoreCase(paymentOrder.getBookingType()) || "SERVICE_BOOKING".equalsIgnoreCase(paymentOrder.getBookingType()))) {
            serviceBookingRepository.findById(paymentOrder.getBookingId()).ifPresent(sb -> {
                if (sb.getStatus() == BookingStatus.PENDING) {
                    sb.setStatus(BookingStatus.CANCELLED);
                    serviceBookingRepository.save(sb);
                }
            });
        }
    }

    @Override
    @Transactional
    public PaymentOrderResponseDTO refundPayment(String razorpayOrderId, String reason) {
        PaymentOrder order = paymentOrderRepository.findByRazorpayOrderIdForUpdate(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentOrder not found with order ID: " + razorpayOrderId));

        // Idempotent guard: if already REFUNDED, return early
        if (order.getStatus() == PaymentStatus.REFUNDED) {
            log.info("PaymentOrder {} is already REFUNDED; returning early (idempotent)", razorpayOrderId);
            return toPaymentOrderResponse(order);
        }

        if (order.getStatus() != PaymentStatus.PAID && order.getStatus() != PaymentStatus.SUCCESS) {
            throw new BusinessRuleException("Only PAID orders can be refunded. Current status is " + order.getStatus());
        }

        String paymentId = order.getRazorpayPaymentId();
        if (paymentId == null || paymentId.isBlank()) {
            throw new BusinessRuleException("Cannot refund order " + razorpayOrderId + " without a recorded Razorpay payment ID");
        }

        // Call Razorpay Refund API
        String refundId = razorpayService.refundPayment(paymentId, order.getAmountInPaise(), reason);
        log.info("Razorpay refund processed with ID {} for order {}", refundId, razorpayOrderId);

        // Update PaymentOrder status to REFUNDED
        order.setStatus(PaymentStatus.REFUNDED);
        order.setFailureReason(reason != null ? "Refunded: " + reason : "Refund processed");
        PaymentOrder savedOrder = paymentOrderRepository.save(order);

        // Sync legacy Payment record if present
        paymentRepository.findByGatewayOrderIdForUpdate(razorpayOrderId).ifPresent(lp -> {
            lp.setStatus(PaymentStatus.REFUNDED);
            lp.setFailureReason(reason != null ? "Refunded: " + reason : "Refund processed");
            paymentRepository.save(lp);
        });

        // Sync linked Order or Booking
        if (savedOrder.getOrderId() != null) {
            orderRepository.findById(savedOrder.getOrderId()).ifPresent(ord -> {
                ord.setPaymentStatus(PaymentStatus.REFUNDED);
                ord.setOrderStatus(OrderStatus.CANCELLED);
                orderRepository.save(ord);
            });
        }
        if (savedOrder.getBookingId() != null) {
            if ("VETERINARY".equalsIgnoreCase(savedOrder.getBookingType())) {
                appointmentRepository.findById(savedOrder.getBookingId()).ifPresent(apt -> {
                    apt.setStatus(AppointmentStatus.CANCELLED);
                    appointmentRepository.save(apt);
                });
            } else {
                serviceBookingRepository.findById(savedOrder.getBookingId()).ifPresent(sb -> {
                    sb.setStatus(BookingStatus.CANCELLED);
                    serviceBookingRepository.save(sb);
                });
            }
        }

        return toPaymentOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public PaymentOrderResponseDTO getPaymentOrderStatus(String razorpayOrderId) {
        PaymentOrder order = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
        Payment lp = paymentRepository.findByGatewayOrderId(razorpayOrderId).orElse(null);

        if (order == null && lp == null) {
            throw new ResourceNotFoundException("No payment order found with ID: " + razorpayOrderId);
        }

        // Active status reconciliation:
        // If order exists and is still CREATED/PENDING:
        if (order != null && (order.getStatus() == PaymentStatus.CREATED || order.getStatus() == PaymentStatus.PENDING)) {
            if (lp != null && (lp.getStatus() == PaymentStatus.SUCCESS || lp.getStatus() == PaymentStatus.PAID)) {
                log.info("Reconciling CREATED PaymentOrder {} from captured legacy Payment record", razorpayOrderId);
                order = fulfillOrderIdempotently(razorpayOrderId, lp.getGatewayPaymentId());
            } else {
                try {
                    String gatewayStatus = razorpayService.fetchOrderStatus(razorpayOrderId);
                    if ("paid".equalsIgnoreCase(gatewayStatus)) {
                        log.info("Reconciling CREATED PaymentOrder {} from gateway status 'paid'", razorpayOrderId);
                        order = fulfillOrderIdempotently(razorpayOrderId, order.getRazorpayPaymentId());
                    }
                } catch (Exception e) {
                    log.debug("Active status reconciliation check failed for order {}: {}", razorpayOrderId, e.getMessage());
                }
            }
        } else if (order == null && lp != null) {
            if (lp.getStatus() == PaymentStatus.SUCCESS || lp.getStatus() == PaymentStatus.PAID) {
                log.info("Reconciling legacy Payment {} to standard PaymentOrder", razorpayOrderId);
                order = fulfillOrderIdempotently(razorpayOrderId, lp.getGatewayPaymentId());
            } else {
                try {
                    String gatewayStatus = razorpayService.fetchOrderStatus(razorpayOrderId);
                    if ("paid".equalsIgnoreCase(gatewayStatus)) {
                        log.info("Reconciling legacy Payment {} to PAID from gateway", razorpayOrderId);
                        order = fulfillOrderIdempotently(razorpayOrderId, lp.getGatewayPaymentId());
                    }
                } catch (Exception e) {
                    log.debug("Active status reconciliation check failed for legacy order {}: {}", razorpayOrderId, e.getMessage());
                }
            }

            if (order == null) {
                order = PaymentOrder.builder()
                        .razorpayOrderId(lp.getGatewayOrderId())
                        .userId(lp.getUser().getId())
                        .orderId(lp.getPaymentFor() == PaymentFor.ORDER ? lp.getReferenceId() : null)
                        .bookingId(lp.getPaymentFor() != PaymentFor.ORDER ? lp.getReferenceId() : null)
                        .amountInPaise(lp.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
                        .currency(lp.getCurrency() != null ? lp.getCurrency() : "INR")
                        .status(lp.getStatus() != null ? lp.getStatus() : PaymentStatus.CREATED)
                        .signatureVerified(lp.getStatus() == PaymentStatus.SUCCESS || lp.getStatus() == PaymentStatus.PAID)
                        .razorpayPaymentId(lp.getGatewayPaymentId())
                        .createdAt(lp.getCreatedAt())
                        .build();
            }
        }

        return toPaymentOrderResponse(order);
    }

    @Override
    @Transactional
    public PaymentOrderResponseDTO getPaymentStatus(String razorpayOrderId) {
        return getPaymentOrderStatus(razorpayOrderId);
    }

    private PaymentOrderResponseDTO toPaymentOrderResponse(PaymentOrder order) {
        java.time.Instant paymentExpiresAt = order.getPaymentExpiresAt();
        if (paymentExpiresAt == null && order.getOrderId() != null) {
            Order linkedOrder = orderRepository.findById(order.getOrderId()).orElse(null);
            if (linkedOrder != null) {
                paymentExpiresAt = linkedOrder.getPaymentExpiresAt();
            }
        }
        Long remainingSeconds = paymentExpiresAt != null
                ? Math.max(0L, java.time.Duration.between(java.time.Instant.now(), paymentExpiresAt).getSeconds())
                : null;
        boolean canRetry = paymentExpiresAt != null
                && java.time.Instant.now().isBefore(paymentExpiresAt)
                && order.getStatus() != PaymentStatus.PAID
                && order.getStatus() != PaymentStatus.SUCCESS;

        return PaymentOrderResponseDTO.builder()
                .orderId(order.getRazorpayOrderId())
                .razorpayOrderId(order.getRazorpayOrderId())
                .amountInPaise(order.getAmountInPaise())
                .currency(order.getCurrency())
                .keyId(razorpayService.getKeyId())
                .paymentOrderId(order.getId())
                .productId(order.getProductId())
                .orderIdReference(order.getOrderId())
                .bookingId(order.getBookingId())
                .status(order.getStatus() != null ? order.getStatus().name() : "CREATED")
                .signatureVerified(order.isSignatureVerified())
                .razorpayPaymentId(order.getRazorpayPaymentId())
                .paymentExpiresAt(paymentExpiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PaymentOrderResponseDTO recordPaymentFailure(com.example.PawConnect.dto.request.payment.RecordFailureRequestDTO request, Long authenticatedUserId) {
        if (authenticatedUserId == null) {
            authenticatedUserId = currentUserService.getCurrentUserId();
        }
        final Long resolvedUserId = authenticatedUserId;

        PaymentOrder paymentOrder = null;
        if (request.getRazorpayOrderId() != null && !request.getRazorpayOrderId().isBlank()) {
            paymentOrder = paymentOrderRepository.findByRazorpayOrderIdForUpdate(request.getRazorpayOrderId()).orElse(null);
        } else if (request.getOrderId() != null) {
            paymentOrder = paymentOrderRepository.findTopByOrderIdOrderByCreatedAtDesc(request.getOrderId()).orElse(null);
        }

        if (paymentOrder == null && request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));
            if (!currentUserService.hasRole("ADMIN") && !order.getUser().getId().equals(resolvedUserId)) {
                throw new ForbiddenException("Access denied: you do not own this order");
            }
            if (order.getPaymentExpiresAt() != null && java.time.Instant.now().isAfter(order.getPaymentExpiresAt())) {
                orderService.expireOrder(order.getId());
            }
            java.time.Instant exp = order.getPaymentExpiresAt();
            Long rem = exp != null ? Math.max(0L, java.time.Duration.between(java.time.Instant.now(), exp).getSeconds()) : 0L;
            boolean retry = exp != null && java.time.Instant.now().isBefore(exp) && order.getOrderStatus() == OrderStatus.PENDING;
            return PaymentOrderResponseDTO.builder()
                    .orderId(order.getOrderNo())
                    .orderIdReference(order.getId())
                    .status("FAILED")
                    .paymentExpiresAt(exp)
                    .remainingPaymentSeconds(rem)
                    .canRetryPayment(retry)
                    .build();
        }

        if (paymentOrder != null) {
            if (paymentOrder.getUserId() != null && !paymentOrder.getUserId().equals(resolvedUserId) && !currentUserService.hasRole("ADMIN")) {
                throw new ForbiddenException("You are not authorized to access this payment order");
            }
            if (paymentOrder.getStatus() != PaymentStatus.PAID && paymentOrder.getStatus() != PaymentStatus.SUCCESS) {
                paymentOrder.setStatus(PaymentStatus.FAILED);
                paymentOrder.setFailureReason(request.getReason() != null ? request.getReason() : "Payment dismissed or failed");
                paymentOrder = paymentOrderRepository.save(paymentOrder);
            }

            java.time.Instant exp = paymentOrder.getPaymentExpiresAt();
            if (paymentOrder.getOrderId() != null) {
                Order order = orderRepository.findById(paymentOrder.getOrderId()).orElse(null);
                if (order != null) {
                    exp = order.getPaymentExpiresAt();
                    if (exp != null && java.time.Instant.now().isAfter(exp)) {
                        orderService.expireOrder(order.getId());
                    }
                }
            }

            Long rem = exp != null ? Math.max(0L, java.time.Duration.between(java.time.Instant.now(), exp).getSeconds()) : 0L;
            boolean retry = exp != null && java.time.Instant.now().isBefore(exp)
                    && paymentOrder.getStatus() != PaymentStatus.PAID;

            return PaymentOrderResponseDTO.builder()
                    .orderId(paymentOrder.getRazorpayOrderId())
                    .razorpayOrderId(paymentOrder.getRazorpayOrderId())
                    .amountInPaise(paymentOrder.getAmountInPaise())
                    .currency(paymentOrder.getCurrency())
                    .keyId(razorpayService.getKeyId())
                    .paymentOrderId(paymentOrder.getId())
                    .productId(paymentOrder.getProductId())
                    .orderIdReference(paymentOrder.getOrderId())
                    .bookingId(paymentOrder.getBookingId())
                    .status(paymentOrder.getStatus().name())
                    .signatureVerified(paymentOrder.isSignatureVerified())
                    .paymentExpiresAt(exp)
                    .remainingPaymentSeconds(rem)
                    .canRetryPayment(retry)
                    .createdAt(paymentOrder.getCreatedAt())
                    .build();
        }

        throw new ResourceNotFoundException("Payment record not found for failure recording");
    }

    // =========================================================================
    // Legacy / Specific Booking Endpoints
    // =========================================================================

    @Override
    @Transactional
    public RazorpayOrderResponse createAppointmentPaymentOrder(Long appointmentId, CreatePaymentOrderRequest request) {
        Appointment appointment = authorizationService.getAppointmentAndRequireOwner(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessRuleException(String.format(
                    "Payment can only be initiated for CONFIRMED appointments. Current status is %s",
                    appointment.getStatus()
            ));
        }

        // Prevent multiple successful payments for the same appointment
        Optional<Payment> existingSuccess = paymentRepository.findByPaymentForAndReferenceIdAndStatus(
                PaymentFor.APPOINTMENT, appointment.getId(), PaymentStatus.SUCCESS
        );
        if (existingSuccess.isPresent()) {
            throw new BusinessRuleException("Appointment has already been paid successfully");
        }

        BigDecimal amount = appointment.getConsultationFee();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Appointment consultation fee is invalid or missing");
        }

        User owner = appointment.getPet().getOwner();
        String receipt = "RCPT-APT-" + System.currentTimeMillis() % 100000000;

        Map<String, String> notes = new HashMap<>();
        notes.put("bookingType", "VETERINARY");
        notes.put("appointmentId", appointment.getId().toString());
        notes.put("appointmentNo", appointment.getAppointmentNo());
        notes.put("ownerId", owner.getId().toString());
        notes.put("petName", appointment.getPet().getName());

        String preferredMethod = (request != null && request.getPreferredMethod() != null && !request.getPreferredMethod().isBlank())
                ? request.getPreferredMethod().trim().toUpperCase()
                : "RAZORPAY";
        notes.put("preferredMethod", preferredMethod);

        String orderId = razorpayService.createOrder(amount, "INR", receipt, notes);

        String paymentReference = "PAY-APT-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Payment payment = Payment.builder()
                .user(owner)
                .paymentReference(paymentReference)
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(appointment.getId())
                .amount(amount)
                .currency("INR")
                .paymentMethod(preferredMethod)
                .status(PaymentStatus.PENDING)
                .gatewayProvider("RAZORPAY")
                .gatewayOrderId(orderId)
                .gatewayStatus("created")
                .build();

        Payment saved = paymentRepository.save(payment);
        appointment.setPayment(saved);
        appointmentRepository.save(appointment);

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .razorpayOrderId(orderId)
                .userId(owner.getId())
                .bookingId(appointment.getId())
                .bookingType("VETERINARY")
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .status(PaymentStatus.CREATED)
                .signatureVerified(false)
                .build();
        paymentOrderRepository.save(paymentOrder);

        log.info("Created payment order {} for appointment {} with method {}", orderId, appointment.getAppointmentNo(), preferredMethod);

        String ownerFullName = (owner.getFirstName() + " " + (owner.getLastName() != null ? owner.getLastName() : "")).trim();
        return RazorpayOrderResponse.builder()
                .razorpayOrderId(orderId)
                .orderId(orderId)
                .amount(amount)
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .keyId(razorpayService.getKeyId())
                .paymentReference(paymentReference)
                .bookingId(appointment.getId())
                .bookingType("VETERINARY")
                .customerName(ownerFullName)
                .customerEmail(owner.getEmail())
                .customerPhone(owner.getPhone())
                .description("Consultation fee for " + appointment.getPet().getName())
                .preferredMethod(preferredMethod)
                .build();
    }

    @Override
    @Transactional
    public RazorpayOrderResponse createServiceBookingPaymentOrder(Long bookingId, CreatePaymentOrderRequest request) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireOwner(bookingId);

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessRuleException(String.format(
                    "Payment can only be initiated for CONFIRMED service bookings. Current status is %s",
                    booking.getStatus()
            ));
        }

        // Prevent multiple successful payments for the same service booking
        Optional<Payment> existingSuccess = paymentRepository.findByPaymentForAndReferenceIdAndStatus(
                PaymentFor.SERVICE_BOOKING, booking.getId(), PaymentStatus.SUCCESS
        );
        if (existingSuccess.isPresent()) {
            throw new BusinessRuleException("Service booking has already been paid successfully");
        }

        BigDecimal amount = booking.getPrice();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Service booking price is invalid or missing");
        }

        User owner = booking.getPet().getOwner();
        String receipt = "RCPT-SB-" + System.currentTimeMillis() % 100000000;

        Map<String, String> notes = new HashMap<>();
        notes.put("bookingType", "SERVICE");
        notes.put("bookingId", booking.getId().toString());
        notes.put("bookingNo", booking.getBookingNo());
        notes.put("ownerId", owner.getId().toString());
        notes.put("petName", booking.getPet().getName());

        String preferredMethod = (request != null && request.getPreferredMethod() != null && !request.getPreferredMethod().isBlank())
                ? request.getPreferredMethod().trim().toUpperCase()
                : "RAZORPAY";
        notes.put("preferredMethod", preferredMethod);

        String orderId = razorpayService.createOrder(amount, "INR", receipt, notes);

        String paymentReference = "PAY-SB-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Payment payment = Payment.builder()
                .user(owner)
                .paymentReference(paymentReference)
                .paymentFor(PaymentFor.SERVICE_BOOKING)
                .referenceId(booking.getId())
                .amount(amount)
                .currency("INR")
                .paymentMethod(preferredMethod)
                .status(PaymentStatus.PENDING)
                .gatewayProvider("RAZORPAY")
                .gatewayOrderId(orderId)
                .gatewayStatus("created")
                .build();

        Payment saved = paymentRepository.save(payment);
        booking.setPayment(saved);
        serviceBookingRepository.save(booking);

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .razorpayOrderId(orderId)
                .userId(owner.getId())
                .bookingId(booking.getId())
                .bookingType("SERVICE")
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .status(PaymentStatus.CREATED)
                .signatureVerified(false)
                .build();
        paymentOrderRepository.save(paymentOrder);

        log.info("Created payment order {} for service booking {} with method {}", orderId, booking.getBookingNo(), preferredMethod);

        String ownerFullName = (owner.getFirstName() + " " + (owner.getLastName() != null ? owner.getLastName() : "")).trim();
        return RazorpayOrderResponse.builder()
                .razorpayOrderId(orderId)
                .orderId(orderId)
                .amount(amount)
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .keyId(razorpayService.getKeyId())
                .paymentReference(paymentReference)
                .bookingId(booking.getId())
                .bookingType("SERVICE")
                .customerName(ownerFullName)
                .customerEmail(owner.getEmail())
                .customerPhone(owner.getPhone())
                .description("Service fee for " + booking.getService().getName())
                .preferredMethod(preferredMethod)
                .build();
    }

    @Override
    @Transactional
    public RazorpayOrderResponse createUnifiedBookingPaymentOrder(Long bookingId, CreatePaymentOrderRequest request) {
        String type = (request != null && request.getBookingType() != null) ? request.getBookingType().trim().toUpperCase() : null;

        if ("VETERINARY".equals(type)) {
            return createAppointmentPaymentOrder(bookingId, request);
        }
        if ("SERVICE".equals(type)) {
            return createServiceBookingPaymentOrder(bookingId, request);
        }

        if ("ORDER".equals(type)) {
            return createOrderPaymentOrder(bookingId, request);
        }

        // Auto-detect based on booking ID and user ownership
        Long currentUserId = currentUserService.getCurrentUserId();
        Optional<Appointment> aptOpt = appointmentRepository.findById(bookingId);
        if (aptOpt.isPresent()) {
            Appointment apt = aptOpt.get();
            if (apt.getPet() != null && apt.getPet().getOwner() != null && currentUserId.equals(apt.getPet().getOwner().getId())) {
                return createAppointmentPaymentOrder(bookingId, request);
            }
            throw new ForbiddenException("Access denied: you do not own this appointment");
        }

        Optional<ServiceBooking> sbOpt = serviceBookingRepository.findById(bookingId);
        if (sbOpt.isPresent()) {
            ServiceBooking sb = sbOpt.get();
            if (sb.getPet() != null && sb.getPet().getOwner() != null && currentUserId.equals(sb.getPet().getOwner().getId())) {
                return createServiceBookingPaymentOrder(bookingId, request);
            }
            throw new ForbiddenException("Access denied: you do not own this service booking");
        }

        Optional<Order> orderOpt = orderRepository.findById(bookingId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            if (order.getUser() != null && currentUserId.equals(order.getUser().getId())) {
                return createOrderPaymentOrder(bookingId, request);
            }
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        throw new ResourceNotFoundException("Booking or order not found with id: " + bookingId);
    }

    @Override
    @Transactional
    public RazorpayOrderResponse createOrderPaymentOrder(Long orderId, CreatePaymentOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Long currentUserId = currentUserService.getCurrentUserId();
        if (!order.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot initiate payment for a CANCELLED order");
        }

        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new BusinessRuleException("Order has already been paid successfully");
        }

        Optional<Payment> existingSuccess = paymentRepository.findByPaymentForAndReferenceIdAndStatus(
                PaymentFor.ORDER, order.getId(), PaymentStatus.SUCCESS
        );
        if (existingSuccess.isPresent()) {
            throw new BusinessRuleException("Order has already been paid successfully");
        }

        BigDecimal amount = order.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Order total amount is invalid");
        }

        User customer = order.getUser();
        String receipt = "RCPT-ORD-" + System.currentTimeMillis() % 100000000;

        Map<String, String> notes = new HashMap<>();
        notes.put("paymentFor", "ORDER");
        notes.put("orderId", order.getId().toString());
        notes.put("orderNo", order.getOrderNo());
        notes.put("userId", customer.getId().toString());

        String preferredMethod = (request != null && request.getPreferredMethod() != null && !request.getPreferredMethod().isBlank())
                ? request.getPreferredMethod().trim().toUpperCase()
                : "RAZORPAY";
        notes.put("preferredMethod", preferredMethod);

        String razorpayOrderId = razorpayService.createOrder(amount, "INR", receipt, notes);

        String paymentReference = "PAY-ORD-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Payment payment = Payment.builder()
                .user(customer)
                .paymentReference(paymentReference)
                .paymentFor(PaymentFor.ORDER)
                .referenceId(order.getId())
                .amount(amount)
                .currency("INR")
                .paymentMethod(preferredMethod)
                .status(PaymentStatus.PENDING)
                .gatewayProvider("RAZORPAY")
                .gatewayOrderId(razorpayOrderId)
                .gatewayStatus("created")
                .build();

        paymentRepository.save(payment);

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .razorpayOrderId(razorpayOrderId)
                .userId(customer.getId())
                .orderId(order.getId())
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .status(PaymentStatus.CREATED)
                .signatureVerified(false)
                .build();
        paymentOrderRepository.save(paymentOrder);

        log.info("Created payment order {} for merchandise order {} with method {}", razorpayOrderId, order.getOrderNo(), preferredMethod);

        String customerFullName = (customer.getFirstName() + " " + (customer.getLastName() != null ? customer.getLastName() : "")).trim();
        return RazorpayOrderResponse.builder()
                .razorpayOrderId(razorpayOrderId)
                .orderId(razorpayOrderId)
                .amount(amount)
                .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                .currency("INR")
                .keyId(razorpayService.getKeyId())
                .paymentReference(paymentReference)
                .bookingId(order.getId())
                .bookingType("ORDER")
                .customerName(customerFullName)
                .customerEmail(customer.getEmail())
                .customerPhone(customer.getPhone())
                .description("Payment for order " + order.getOrderNo())
                .preferredMethod(preferredMethod)
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse verifyCheckoutPayment(VerifyPaymentRequest request) {
        // Pessimistic write lock serializes concurrent verification requests for the same order
        Payment payment = paymentRepository.findByGatewayOrderIdForUpdate(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment found matching Razorpay order ID: " + request.getRazorpayOrderId()));

        // Cryptographic HMAC-SHA256 signature verification
        boolean validSignature = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );
        if (!validSignature) {
            log.warn("Invalid payment signature for order {}", request.getRazorpayOrderId());
            throw new PaymentVerificationException("Razorpay payment signature verification failed");
        }

        // Ownership verification
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!currentUserService.hasRole("ADMIN") && !payment.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: you do not own this payment record");
        }

        // Idempotent success handling: repeated verification of an already successful payment returns current state
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment for order {} was already verified successfully; returning existing record", request.getRazorpayOrderId());
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setGatewayPaymentId(request.getRazorpayPaymentId());
        payment.setGatewaySignature(request.getRazorpaySignature());
        payment.setGatewayStatus("captured");
        payment.setPaidAt(LocalDateTime.now());
        payment.setCapturedAt(LocalDateTime.now());
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            payment.setPaymentMethod(request.getPaymentMethod().trim().toUpperCase());
        }

        Payment saved = paymentRepository.save(payment);
        log.info("Payment {} successfully verified for order {}", saved.getPaymentReference(), request.getRazorpayOrderId());

        // Ensure association is linked to the booking or order
        if (payment.getPaymentFor() == PaymentFor.APPOINTMENT) {
            appointmentRepository.findById(payment.getReferenceId()).ifPresent(apt -> {
                if (apt.getPayment() == null) {
                    apt.setPayment(saved);
                    appointmentRepository.save(apt);
                }

                User owner = (apt.getPet() != null) ? apt.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = "NOTIF-PAYMENT-APT-" + apt.getId() + "-SUCCESS";
                    notificationService.createNotification(
                            owner,
                            NotificationType.PAYMENT_SUCCESS,
                            "Appointment Payment Successful",
                            String.format("Payment of INR %s for appointment %s received successfully.", saved.getAmount(), apt.getAppointmentNo()),
                            "APPOINTMENT",
                            apt.getId(),
                            dedupeKey
                    );
                }
            });
        } else if (payment.getPaymentFor() == PaymentFor.SERVICE_BOOKING) {
            serviceBookingRepository.findById(payment.getReferenceId()).ifPresent(sb -> {
                if (sb.getPayment() == null) {
                    sb.setPayment(saved);
                    serviceBookingRepository.save(sb);
                }

                User owner = (sb.getPet() != null) ? sb.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = "NOTIF-PAYMENT-SB-" + sb.getId() + "-SUCCESS";
                    notificationService.createNotification(
                            owner,
                            NotificationType.PAYMENT_SUCCESS,
                            "Service Booking Payment Successful",
                            String.format("Payment of INR %s for booking %s received successfully.", saved.getAmount(), sb.getBookingNo()),
                            "SERVICE_BOOKING",
                            sb.getId(),
                            dedupeKey
                    );
                }
            });
        } else if (payment.getPaymentFor() == PaymentFor.ORDER) {
            orderRepository.findById(payment.getReferenceId()).ifPresent(ord -> {
                ord.setPaymentStatus(PaymentStatus.SUCCESS);
                orderRepository.save(ord);

                String dedupeKey = "NOTIF-ORDER-" + ord.getId() + "-PAID";
                notificationService.createNotification(
                        ord.getUser(),
                        NotificationType.PAYMENT_SUCCESS,
                        "Payment Successful",
                        String.format("Payment of INR %s for order %s received successfully.", saved.getAmount(), ord.getOrderNo()),
                        "ORDER",
                        ord.getId(),
                        dedupeKey
                );
            });
        }

        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponse confirmUpiPayment(com.example.PawConnect.dto.request.payment.ConfirmUpiPaymentRequest request) {
        if (request == null || request.getGatewayOrderId() == null || request.getGatewayOrderId().isBlank()) {
            throw new BusinessRuleException("Gateway order ID is required to confirm UPI payment");
        }

        Payment payment = paymentRepository.findByGatewayOrderIdForUpdate(request.getGatewayOrderId())
                .orElseGet(() -> {
                    if (request.getPaymentReference() != null && !request.getPaymentReference().isBlank()) {
                        return paymentRepository.findByPaymentReference(request.getPaymentReference())
                                .orElseThrow(() -> new ResourceNotFoundException("No payment found matching order ID: " + request.getGatewayOrderId()));
                    }
                    throw new ResourceNotFoundException("No payment found matching order ID: " + request.getGatewayOrderId());
                });

        // Ownership verification
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!currentUserService.hasRole("ADMIN") && !payment.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: you do not own this payment record");
        }

        // Idempotent success handling
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("UPI payment for order {} was already confirmed; returning existing record", request.getGatewayOrderId());
            return paymentMapper.toResponse(payment);
        }

        String paymentId = (request.getTransactionId() != null && !request.getTransactionId().isBlank())
                ? request.getTransactionId().trim()
                : "pay_upi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        String signature = razorpayService.generatePaymentSignature(payment.getGatewayOrderId(), paymentId);

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentMethod("UPI");
        payment.setGatewayPaymentId(paymentId);
        payment.setGatewaySignature(signature);
        payment.setGatewayStatus("captured");
        payment.setPaidAt(LocalDateTime.now());
        payment.setCapturedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        log.info("UPI Payment {} successfully confirmed for order {} via app {}", saved.getPaymentReference(), request.getGatewayOrderId(), request.getUpiApp());

        // Update target entity and trigger notifications
        if (payment.getPaymentFor() == PaymentFor.APPOINTMENT) {
            appointmentRepository.findById(payment.getReferenceId()).ifPresent(apt -> {
                if (apt.getPayment() == null) {
                    apt.setPayment(saved);
                    appointmentRepository.save(apt);
                }

                User owner = (apt.getPet() != null) ? apt.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = "NOTIF-PAYMENT-APT-" + apt.getId() + "-UPI-SUCCESS";
                    notificationService.createNotification(
                            owner,
                            NotificationType.PAYMENT_SUCCESS,
                            "Appointment Payment Successful (UPI)",
                            String.format("UPI payment of INR %s for appointment %s received successfully.", saved.getAmount(), apt.getAppointmentNo()),
                            "APPOINTMENT",
                            apt.getId(),
                            dedupeKey
                    );
                }
            });
        } else if (payment.getPaymentFor() == PaymentFor.SERVICE_BOOKING) {
            serviceBookingRepository.findById(payment.getReferenceId()).ifPresent(sb -> {
                if (sb.getPayment() == null) {
                    sb.setPayment(saved);
                    serviceBookingRepository.save(sb);
                }

                User owner = (sb.getPet() != null) ? sb.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = "NOTIF-PAYMENT-SB-" + sb.getId() + "-UPI-SUCCESS";
                    notificationService.createNotification(
                            owner,
                            NotificationType.PAYMENT_SUCCESS,
                            "Service Booking Payment Successful (UPI)",
                            String.format("UPI payment of INR %s for booking %s received successfully.", saved.getAmount(), sb.getBookingNo()),
                            "SERVICE_BOOKING",
                            sb.getId(),
                            dedupeKey
                    );
                }
            });
        } else if (payment.getPaymentFor() == PaymentFor.ORDER) {
            orderRepository.findById(payment.getReferenceId()).ifPresent(ord -> {
                ord.setPaymentStatus(PaymentStatus.SUCCESS);
                orderRepository.save(ord);

                String dedupeKey = "NOTIF-ORDER-" + ord.getId() + "-UPI-PAID";
                notificationService.createNotification(
                        ord.getUser(),
                        NotificationType.PAYMENT_SUCCESS,
                        "Payment Successful (UPI)",
                        String.format("UPI payment of INR %s for order %s received successfully.", saved.getAmount(), ord.getOrderNo()),
                        "ORDER",
                        ord.getId(),
                        dedupeKey
                );
            });
        }

        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getBookingPayment(Long bookingId, String bookingType) {
        Long currentUserId = currentUserService.getCurrentUserId();

        if ("VETERINARY".equalsIgnoreCase(bookingType)) {
            return getAppointmentPayment(bookingId);
        }
        if ("SERVICE".equalsIgnoreCase(bookingType)) {
            return getServiceBookingPayment(bookingId);
        }

        // Auto-detect appointment first
        Optional<Appointment> aptOpt = appointmentRepository.findById(bookingId);
        if (aptOpt.isPresent()) {
            Appointment apt = aptOpt.get();
            if (apt.getPet() != null && apt.getPet().getOwner() != null && currentUserId.equals(apt.getPet().getOwner().getId())) {
                return getAppointmentPayment(bookingId);
            }
            throw new ForbiddenException("Access denied: you do not own this booking");
        }

        Optional<ServiceBooking> sbOpt = serviceBookingRepository.findById(bookingId);
        if (sbOpt.isPresent()) {
            ServiceBooking sb = sbOpt.get();
            if (sb.getPet() != null && sb.getPet().getOwner() != null && currentUserId.equals(sb.getPet().getOwner().getId())) {
                return getServiceBookingPayment(bookingId);
            }
            throw new ForbiddenException("Access denied: you do not own this booking");
        }

        throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getAppointmentPayment(Long appointmentId) {
        Appointment appointment = authorizationService.getAppointmentAndRequireOwner(appointmentId);
        Payment payment = paymentRepository.findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.APPOINTMENT, appointment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for appointment id: " + appointmentId));

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getServiceBookingPayment(Long bookingId) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireOwner(bookingId);
        Payment payment = paymentRepository.findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.SERVICE_BOOKING, booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for service booking id: " + bookingId));

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getOrderPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Long currentUserId = currentUserService.getCurrentUserId();
        if (!currentUserService.hasRole("ADMIN") && !order.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: you do not own this order");
        }

        Payment payment = paymentRepository.findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.ORDER, order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for order id: " + orderId));

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        Long currentUserId = currentUserService.getCurrentUserId();
        if (!currentUserService.hasRole("ADMIN") && !payment.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: you do not own this payment record");
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public void processWebhook(String rawPayload, String signatureHeader) {
        handleWebhook(rawPayload, signatureHeader);
    }
}
