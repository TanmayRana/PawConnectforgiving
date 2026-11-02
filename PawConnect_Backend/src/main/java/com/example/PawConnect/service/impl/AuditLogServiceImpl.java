package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.admin.AuditLogResponse;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.AuditLog;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.AuditLogRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.CurrentUserService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserService currentUserService;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "createdAt", "action", "module", "entityType"
    );
    private static final int MAX_PAGE_SIZE = 100;

    private static final Pattern SENSITIVE_PATTERNS = Pattern.compile(
            "(?i)\"(?:password|token|secret|signature|cvv|otp|refreshToken)\"\\s*:\\s*\"[^\"]*\""
    );

    @Override
    @Transactional
    public void recordAudit(User actor, String action, String module, String entityType, Long entityId,
                            String oldData, String newData, String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .module(module)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldData(sanitize(oldData))
                    .newData(sanitize(newData))
                    .ipAddress(ipAddress != null && ipAddress.length() > 50 ? ipAddress.substring(0, 50) : ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Recorded audit log for action: {} in module: {}", action, module);
        } catch (Exception ex) {
            log.error("Failed to record audit log: action={}, module={}, error={}", action, module, ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void logAction(String action, String module, String entityType, Long entityId, String oldData, String newData) {
        User actor = null;
        try {
            actor = currentUserService.getCurrentUser();
        } catch (Exception e) {
            log.debug("No authenticated user in current context for audit log");
        }

        String ipAddress = null;
        String userAgent = null;

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isBlank()) {
                ipAddress = request.getRemoteAddr();
            }
            userAgent = request.getHeader("User-Agent");
        }

        recordAudit(actor, action, module, entityType, entityId, oldData, newData, ipAddress, userAgent);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(Long userId, String module, String action, String entityType,
                                                       LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Pageable sanitized = sanitizePageable(pageable);

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (module != null && !module.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("module")), module.trim().toLowerCase()));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("action")), action.trim().toLowerCase()));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("entityType")), entityType.trim().toLowerCase()));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> page = auditLogRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogById(Long id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found with id: " + id));
        return mapToResponse(auditLog);
    }

    private String sanitize(String jsonOrText) {
        if (jsonOrText == null || jsonOrText.isBlank()) {
            return jsonOrText;
        }
        return SENSITIVE_PATTERNS.matcher(jsonOrText).replaceAll("\"[REDACTED]\"");
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        String fullName = null;
        String email = null;
        Long userId = null;

        if (log.getUser() != null) {
            userId = log.getUser().getId();
            email = log.getUser().getEmail();
            fullName = (log.getUser().getFirstName() != null ? log.getUser().getFirstName() : "")
                    + (log.getUser().getLastName() != null ? " " + log.getUser().getLastName() : "");
            fullName = fullName.trim();
        }

        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(userId)
                .userEmail(email)
                .userFullName(fullName)
                .action(log.getAction())
                .module(log.getModule())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldData(log.getOldData())
                .newData(log.getNewData())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new IllegalArgumentException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), ALLOWED_SORT_FIELDS
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
