package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.CreatePromoCodeRequest;
import com.example.PawConnect.dto.request.admin.UpdatePromoCodeRequest;
import com.example.PawConnect.dto.response.PromoCodeResponse;
import com.example.PawConnect.dto.response.PromoValidationResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.CartItemRepository;
import com.example.PawConnect.repository.CartRepository;
import com.example.PawConnect.repository.OrderRepository;
import com.example.PawConnect.repository.PromoCodeRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.PromoCodeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromoCodeServiceImpl implements PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "code", "discountType", "discountValue", "minOrderAmount",
            "usedCount", "validFrom", "validUntil", "isActive", "createdAt"
    );
    private static final int MAX_PAGE_SIZE = 100;

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                validOrders.add(order);
            }
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }

    @Override
    @Transactional
    public PromoCodeResponse createPromoCode(CreatePromoCodeRequest request) {
        if (request.getCode() == null || request.getCode().trim().isBlank()) {
            throw new BusinessRuleException("Promo code is required");
        }

        String normalizedCode = request.getCode().trim().toUpperCase();

        if (promoCodeRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new BusinessRuleException("Promo code already exists: " + normalizedCode);
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue() == null || request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("Percentage discount value must be greater than zero");
            }
            if (request.getDiscountValue().compareTo(new BigDecimal("100.00")) > 0) {
                throw new BusinessRuleException("Percentage discount value cannot exceed 100%");
            }
        }

        if (request.getValidFrom() != null && request.getValidUntil() != null
                && request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new BusinessRuleException("Validity end date (validUntil) cannot be before start date (validFrom)");
        }

        PromoCode promoCode = PromoCode.builder()
                .code(normalizedCode)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue().setScale(2, RoundingMode.HALF_UP))
                .minOrderAmount(request.getMinOrderAmount() != null
                        ? request.getMinOrderAmount().setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount() != null
                        ? request.getMaxDiscountAmount().setScale(2, RoundingMode.HALF_UP)
                        : null)
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .perUserLimit(request.getPerUserLimit() != null ? request.getPerUserLimit() : 1)
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        PromoCode saved = promoCodeRepository.save(promoCode);
        log.info("Created new promo code with ID {} and code {}", saved.getId(), saved.getCode());

        PromoCodeResponse response = mapToResponse(saved);
        recordAuditSafely("CREATE_PROMO_CODE", saved.getId(), null, response);

        return response;
    }

    @Override
    @Transactional
    public PromoCodeResponse updatePromoCode(Long id, UpdatePromoCodeRequest request) {
        PromoCode promoCode = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promo code not found with id: " + id));

        String oldDataJson = toJsonSafely(mapToResponse(promoCode));

        if (request.getCode() != null && !request.getCode().trim().isBlank()) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(promoCode.getCode()) && promoCodeRepository.existsByCodeIgnoreCase(newCode)) {
                throw new BusinessRuleException("Promo code already exists: " + newCode);
            }
            promoCode.setCode(newCode);
        }

        if (request.getDescription() != null) {
            promoCode.setDescription(request.getDescription().trim());
        }

        if (request.getDiscountType() != null) {
            promoCode.setDiscountType(request.getDiscountType());
        }

        if (request.getDiscountValue() != null) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("Discount value must be greater than zero");
            }
            promoCode.setDiscountValue(request.getDiscountValue().setScale(2, RoundingMode.HALF_UP));
        }

        if (promoCode.getDiscountType() == DiscountType.PERCENTAGE
                && promoCode.getDiscountValue().compareTo(new BigDecimal("100.00")) > 0) {
            throw new BusinessRuleException("Percentage discount value cannot exceed 100%");
        }

        if (request.getMinOrderAmount() != null) {
            promoCode.setMinOrderAmount(request.getMinOrderAmount().setScale(2, RoundingMode.HALF_UP));
        }

        if (request.getMaxDiscountAmount() != null) {
            promoCode.setMaxDiscountAmount(request.getMaxDiscountAmount().setScale(2, RoundingMode.HALF_UP));
        }

        if (request.getUsageLimit() != null) {
            promoCode.setUsageLimit(request.getUsageLimit());
        }

        if (request.getPerUserLimit() != null) {
            promoCode.setPerUserLimit(request.getPerUserLimit());
        }

        if (request.getValidFrom() != null) {
            promoCode.setValidFrom(request.getValidFrom());
        }

        if (request.getValidUntil() != null) {
            promoCode.setValidUntil(request.getValidUntil());
        }

        if (promoCode.getValidFrom() != null && promoCode.getValidUntil() != null
                && promoCode.getValidUntil().isBefore(promoCode.getValidFrom())) {
            throw new BusinessRuleException("Validity end date (validUntil) cannot be before start date (validFrom)");
        }

        if (request.getIsActive() != null) {
            promoCode.setIsActive(request.getIsActive());
        }

        PromoCode updated = promoCodeRepository.save(promoCode);
        log.info("Updated promo code ID {} (code {})", updated.getId(), updated.getCode());

        PromoCodeResponse response = mapToResponse(updated);
        recordAuditSafely("UPDATE_PROMO_CODE", updated.getId(), oldDataJson, response);

        return response;
    }

    @Override
    @Transactional
    public PromoCodeResponse togglePromoCodeStatus(Long id, Boolean isActive) {
        PromoCode promoCode = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promo code not found with id: " + id));

        String oldDataJson = toJsonSafely(mapToResponse(promoCode));

        boolean newActiveStatus = (isActive != null) ? isActive : !Boolean.TRUE.equals(promoCode.getIsActive());
        promoCode.setIsActive(newActiveStatus);

        PromoCode updated = promoCodeRepository.save(promoCode);
        log.info("Toggled promo code ID {} active status to {}", updated.getId(), newActiveStatus);

        PromoCodeResponse response = mapToResponse(updated);
        recordAuditSafely("TOGGLE_PROMO_CODE_STATUS", updated.getId(), oldDataJson, response);

        return response;
    }

    @Override
    @Transactional
    public void deletePromoCode(Long id) {
        PromoCode promoCode = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promo code not found with id: " + id));

        String oldDataJson = toJsonSafely(mapToResponse(promoCode));

        promoCodeRepository.delete(promoCode);
        log.info("Deleted promo code ID {} (code {})", id, promoCode.getCode());

        recordAuditSafely("DELETE_PROMO_CODE", id, oldDataJson, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PromoCodeResponse> getPromoCodes(String search, Boolean isActive, Pageable pageable) {
        Pageable sanitized = sanitizePageable(pageable);

        Specification<PromoCode> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), term);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), term);
                predicates.add(cb.or(codeMatch, descMatch));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PromoCode> page = promoCodeRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PromoCodeResponse getPromoCodeById(Long id) {
        PromoCode promoCode = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promo code not found with id: " + id));
        return mapToResponse(promoCode);
    }

    @Override
    @Transactional(readOnly = true)
    public PromoValidationResponse validatePromoCodeForCart(Long userId, String code) {
        if (code == null || code.trim().isBlank()) {
            throw new BusinessRuleException("Promo code is required");
        }

        String normalizedCode = code.trim().toUpperCase();

        // 1. Fetch customer's active cart
        Cart cart = cartRepository.findTopByUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new BusinessRuleException("Cart is empty. Add items to cart before applying promo code."));

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        if (items.isEmpty()) {
            throw new BusinessRuleException("Cart is empty. Add items to cart before applying promo code.");
        }

        // Calculate current trusted subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : items) {
            Product product = item.getProduct();
            if (product != null && Boolean.TRUE.equals(product.getIsActive()) && product.getStatus() == ProductStatus.ACTIVE) {
                BigDecimal price = product.getPrice() != null ? product.getPrice() : item.getUnitPrice();
                if (price != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Cart items are unavailable or have zero value");
        }

        // 2. Fetch promo code
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new BusinessRuleException("Invalid promo code: " + normalizedCode));

        // 3. Validate rules
        validatePromoCode(promo, userId, subtotal);

        // 4. Calculate discount
        BigDecimal discountAmount = calculateDiscount(promo, subtotal);
        BigDecimal finalTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        return PromoValidationResponse.builder()
                .code(promo.getCode())
                .discountType(promo.getDiscountType())
                .discountValue(promo.getDiscountValue())
                .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                .discountAmount(discountAmount)
                .finalTotal(finalTotal)
                .message(String.format("Promo code '%s' applied successfully! You saved ₹%s.",
                        promo.getCode(), discountAmount.stripTrailingZeros().toPlainString()))
                .build();
    }

    @Override
    public void validatePromoCode(PromoCode promo, Long userId, BigDecimal subtotal) {
        if (promo == null) {
            throw new BusinessRuleException("Invalid promo code");
        }

        // 1. Is active
        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new BusinessRuleException("Promo code " + promo.getCode() + " is no longer active");
        }

        // 2. Date validity
        LocalDateTime now = LocalDateTime.now();
        if (promo.getValidFrom() != null && now.isBefore(promo.getValidFrom())) {
            throw new BusinessRuleException("Promo code " + promo.getCode() + " is not yet active");
        }
        if (promo.getValidUntil() != null && now.isAfter(promo.getValidUntil())) {
            throw new BusinessRuleException("Promo code " + promo.getCode() + " has expired");
        }

        // 3. Platform total usage limit
        if (promo.getUsageLimit() != null && promo.getUsedCount() != null
                && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new BusinessRuleException("Promo code " + promo.getCode() + " has reached its global usage limit");
        }

        // 4. Per-user limit (check non-cancelled orders by userId and promoCode)
        if (userId != null && promo.getPerUserLimit() != null) {
            long userOrderCount = orderRepository.countUserPromoCodeUsage(userId, promo.getCode(), OrderStatus.CANCELLED);
            if (userOrderCount >= promo.getPerUserLimit()) {
                throw new BusinessRuleException("You have already used promo code " + promo.getCode() + " the maximum number of times allowed");
            }
        }

        // 5. Minimum order amount
        if (promo.getMinOrderAmount() != null && subtotal != null
                && subtotal.compareTo(promo.getMinOrderAmount()) < 0) {
            throw new BusinessRuleException(String.format("Minimum order amount of ₹%s required for %s",
                    promo.getMinOrderAmount().stripTrailingZeros().toPlainString(), promo.getCode()));
        }
    }

    @Override
    public BigDecimal calculateDiscount(PromoCode promo, BigDecimal subtotal) {
        if (promo == null || subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal discount;

        if (promo.getDiscountType() == DiscountType.PERCENTAGE) {
            // subtotal * (discountValue / 100)
            discount = subtotal.multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (promo.getMaxDiscountAmount() != null && discount.compareTo(promo.getMaxDiscountAmount()) > 0) {
                discount = promo.getMaxDiscountAmount().setScale(2, RoundingMode.HALF_UP);
            }
        } else {
            // FIXED_AMOUNT
            discount = promo.getDiscountValue().setScale(2, RoundingMode.HALF_UP);
        }

        // Guard: discount must never exceed subtotal
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal.setScale(2, RoundingMode.HALF_UP);
        }

        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            discount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    private PromoCodeResponse mapToResponse(PromoCode p) {
        return PromoCodeResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .description(p.getDescription())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .minOrderAmount(p.getMinOrderAmount())
                .maxDiscountAmount(p.getMaxDiscountAmount())
                .usageLimit(p.getUsageLimit())
                .usedCount(p.getUsedCount())
                .perUserLimit(p.getPerUserLimit())
                .validFrom(p.getValidFrom())
                .validUntil(p.getValidUntil())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private void recordAuditSafely(String action, Long entityId, Object oldData, Object newData) {
        try {
            String oldJson = (oldData instanceof String) ? (String) oldData : toJsonSafely(oldData);
            String newJson = (newData instanceof String) ? (String) newData : toJsonSafely(newData);
            auditLogService.logAction(action, "PROMO_CODE", "PromoCode", entityId, oldJson, newJson);
        } catch (Exception ex) {
            log.warn("Failed to record audit log for promo code {}: {}", entityId, ex.getMessage());
        }
    }

    private String toJsonSafely(Object object) {
        if (object == null) return null;
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            return String.valueOf(object);
        }
    }
}
