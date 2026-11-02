package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.admin.AdminPaymentRecordResponse;
import com.example.PawConnect.dto.response.admin.AdminPaymentSummaryResponse;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminPaymentService;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.PaymentService;
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
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final PaymentService paymentService;
    private final AuditLogService auditLogService;

    public AdminPaymentServiceImpl(
            PaymentOrderRepository paymentOrderRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            OrderRepository orderRepository,
            AppointmentRepository appointmentRepository,
            ServiceBookingRepository serviceBookingRepository,
            PaymentService paymentService,
            AuditLogService auditLogService
    ) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.appointmentRepository = appointmentRepository;
        this.serviceBookingRepository = serviceBookingRepository;
        this.paymentService = paymentService;
        this.auditLogService = auditLogService;
    }

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "createdAt", "updatedAt", "amountInPaise", "status", "razorpayOrderId"
    );
    private static final int MAX_PAGE_SIZE = 100;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminPaymentRecordResponse> getPayments(
            PaymentStatus status,
            String paymentFor,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable);

        Specification<PaymentOrder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (paymentFor != null && !paymentFor.isBlank() && !"ALL".equalsIgnoreCase(paymentFor)) {
                String pf = paymentFor.trim().toUpperCase();
                if ("ORDER".equals(pf)) {
                    predicates.add(cb.isNotNull(root.get("orderId")));
                } else if ("APPOINTMENT".equals(pf)) {
                    predicates.add(cb.and(
                            cb.isNotNull(root.get("bookingId")),
                            cb.equal(cb.upper(root.get("bookingType")), "VETERINARY")
                    ));
                } else if ("SERVICE_BOOKING".equals(pf) || "SERVICE".equals(pf)) {
                    predicates.add(cb.and(
                            cb.isNotNull(root.get("bookingId")),
                            cb.notEqual(cb.upper(root.get("bookingType")), "VETERINARY")
                    ));
                }
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (search != null && !search.isBlank()) {
                String q = search.trim();
                List<Predicate> searchOrs = new ArrayList<>();
                searchOrs.add(cb.like(cb.lower(root.get("razorpayOrderId")), "%" + q.toLowerCase() + "%"));
                searchOrs.add(cb.like(cb.lower(root.get("razorpayPaymentId")), "%" + q.toLowerCase() + "%"));

                List<Long> userIds = userRepository.findIdsBySearchTerm(q);
                if (!userIds.isEmpty()) {
                    searchOrs.add(root.get("userId").in(userIds));
                }

                List<Long> orderIds = orderRepository.findIdsByOrderNoLike(q);
                if (!orderIds.isEmpty()) {
                    searchOrs.add(root.get("orderId").in(orderIds));
                }

                List<Long> aptIds = appointmentRepository.findIdsByAppointmentNoLike(q);
                if (!aptIds.isEmpty()) {
                    searchOrs.add(cb.and(root.get("bookingId").in(aptIds), cb.equal(cb.upper(root.get("bookingType")), "VETERINARY")));
                }

                List<Long> bookingIds = serviceBookingRepository.findIdsByBookingNoLike(q);
                if (!bookingIds.isEmpty()) {
                    searchOrs.add(cb.and(root.get("bookingId").in(bookingIds), cb.notEqual(cb.upper(root.get("bookingType")), "VETERINARY")));
                }

                predicates.add(cb.or(searchOrs.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PaymentOrder> page = paymentOrderRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapToAdminRecord));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentSummaryResponse getPaymentSummary() {
        List<PaymentOrder> all = paymentOrderRepository.findAll();
        long totalTransactions = all.size();
        long successfulCount = 0;
        long pendingCount = 0;
        long failedCount = 0;
        long refundedCount = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalRefunded = BigDecimal.ZERO;

        for (PaymentOrder po : all) {
            PaymentStatus st = po.getStatus();
            if (st == PaymentStatus.PAID || st == PaymentStatus.SUCCESS) {
                successfulCount++;
                if (po.getAmountInPaise() != null) {
                    BigDecimal amt = BigDecimal.valueOf(po.getAmountInPaise()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    totalRevenue = totalRevenue.add(amt);
                }
            } else if (st == PaymentStatus.CREATED || st == PaymentStatus.PENDING) {
                pendingCount++;
            } else if (st == PaymentStatus.FAILED) {
                failedCount++;
            } else if (st == PaymentStatus.REFUNDED) {
                refundedCount++;
                if (po.getAmountInPaise() != null) {
                    BigDecimal amt = BigDecimal.valueOf(po.getAmountInPaise()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    totalRefunded = totalRefunded.add(amt);
                }
            }
        }

        return AdminPaymentSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .successfulCount(successfulCount)
                .pendingCount(pendingCount)
                .failedCount(failedCount)
                .refundedCount(refundedCount)
                .totalRefundedAmount(totalRefunded)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentRecordResponse getPaymentById(Long id) {
        PaymentOrder po = paymentOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with id: " + id));
        return mapToAdminRecord(po);
    }

    @Override
    @Transactional
    public AdminPaymentRecordResponse refundPaymentByAdmin(String razorpayOrderId, String reason) {
        PaymentOrder po = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with Razorpay order ID: " + razorpayOrderId));

        String oldStatus = po.getStatus() != null ? po.getStatus().name() : "UNKNOWN";
        paymentService.refundPayment(razorpayOrderId, reason != null ? reason : "Administrative refund executed via Admin Console");

        PaymentOrder updated = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId).orElse(po);

        auditLogService.logAction(
                "ADMIN_REFUND",
                "PAYMENT",
                "PaymentOrder",
                updated.getId(),
                "status: " + oldStatus,
                "status: REFUNDED, reason: " + reason
        );

        return mapToAdminRecord(updated);
    }

    private AdminPaymentRecordResponse mapToAdminRecord(PaymentOrder po) {
        User user = po.getUserId() != null ? userRepository.findById(po.getUserId()).orElse(null) : null;
        String customerName = user != null ? user.getFullName() : "Customer #" + po.getUserId();
        String customerEmail = user != null ? user.getEmail() : null;
        String customerPhone = user != null ? user.getPhone() : null;

        String paymentFor = "ORDER";
        Long referenceId = po.getOrderId();
        String referenceNumber = null;

        if (po.getOrderId() != null) {
            paymentFor = "ORDER";
            referenceId = po.getOrderId();
            Order order = orderRepository.findById(po.getOrderId()).orElse(null);
            if (order != null) {
                referenceNumber = order.getOrderNo();
            }
        } else if (po.getBookingId() != null) {
            if ("VETERINARY".equalsIgnoreCase(po.getBookingType())) {
                paymentFor = "APPOINTMENT";
                referenceId = po.getBookingId();
                Appointment apt = appointmentRepository.findById(po.getBookingId()).orElse(null);
                if (apt != null) {
                    referenceNumber = apt.getAppointmentNo();
                }
            } else {
                paymentFor = "SERVICE_BOOKING";
                referenceId = po.getBookingId();
                ServiceBooking sb = serviceBookingRepository.findById(po.getBookingId()).orElse(null);
                if (sb != null) {
                    referenceNumber = sb.getBookingNo();
                }
            }
        }

        Optional<Payment> lpOpt = paymentRepository.findByGatewayOrderId(po.getRazorpayOrderId());
        String paymentRef = lpOpt.map(Payment::getPaymentReference)
                .orElse("PAY-" + (po.getRazorpayPaymentId() != null ? po.getRazorpayPaymentId() : po.getRazorpayOrderId()));
        String method = lpOpt.map(Payment::getPaymentMethod).orElse("RAZORPAY");
        LocalDateTime capturedAt = lpOpt.map(Payment::getCapturedAt)
                .orElse(po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS ? po.getUpdatedAt() : null);

        BigDecimal amount = BigDecimal.ZERO;
        Long amountInPaise = po.getAmountInPaise();
        if (amountInPaise != null) {
            amount = BigDecimal.valueOf(amountInPaise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if (lpOpt.isPresent() && lpOpt.get().getAmount() != null) {
            amount = lpOpt.get().getAmount();
            amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        } else {
            amountInPaise = 0L;
        }

        String refundReason = null;
        if (po.getStatus() == PaymentStatus.REFUNDED) {
            refundReason = po.getFailureReason();
        }

        return AdminPaymentRecordResponse.builder()
                .id(po.getId())
                .paymentReference(paymentRef)
                .razorpayOrderId(po.getRazorpayOrderId())
                .razorpayPaymentId(po.getRazorpayPaymentId())
                .signatureVerified(po.isSignatureVerified())
                .userId(po.getUserId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .paymentFor(paymentFor)
                .referenceId(referenceId)
                .referenceNumber(referenceNumber)
                .amount(amount)
                .amountInPaise(amountInPaise)
                .currency(po.getCurrency() != null ? po.getCurrency() : "INR")
                .paymentMethod(method)
                .status(po.getStatus())
                .failureReason(po.getFailureReason())
                .refundReason(refundReason)
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .capturedAt(capturedAt)
                .build();
    }

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if ("createdAt".equalsIgnoreCase(order.getProperty())
                    || "updatedAt".equalsIgnoreCase(order.getProperty())
                    || "id".equalsIgnoreCase(order.getProperty())
                    || "amountInPaise".equalsIgnoreCase(order.getProperty())
                    || "status".equalsIgnoreCase(order.getProperty())
                    || "amount".equalsIgnoreCase(order.getProperty())) {
                String prop = "amount".equalsIgnoreCase(order.getProperty()) ? "amountInPaise" : order.getProperty();
                validOrders.add(new Sort.Order(order.getDirection(), prop));
            }
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
