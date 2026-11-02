package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.CreateBroadcastRequest;
import com.example.PawConnect.dto.response.admin.BroadcastAnnouncementResponse;
import com.example.PawConnect.dto.response.NotificationResponse;
import com.example.PawConnect.dto.response.UnreadCountResponse;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.NotificationMapper;
import com.example.PawConnect.model.BroadcastAnnouncement;
import com.example.PawConnect.model.Notification;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.BroadcastAnnouncementRepository;
import com.example.PawConnect.repository.NotificationRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.event.NotificationCreatedEvent;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.EmailService;
import com.example.PawConnect.service.EmailTemplateService;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.service.SmsService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final SmsService smsService;
    private final ApplicationEventPublisher eventPublisher;
    private final BroadcastAnnouncementRepository broadcastAnnouncementRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public NotificationResponse createNotification(
            User user,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId,
            String dedupeKey
    ) {
        if (user == null) {
            log.warn("Cannot create notification for null user");
            return null;
        }

        // Idempotency / deduplication check
        if (dedupeKey != null && !dedupeKey.isBlank()) {
            Optional<Notification> existing = notificationRepository.findByDedupeKey(dedupeKey);
            if (existing.isPresent()) {
                log.info("Duplicate notification ignored for dedupeKey: {}", dedupeKey);
                return notificationMapper.toResponse(existing.get());
            }
        }

        Notification notification = Notification.builder()
                .user(user)
                .notificationType(type)
                .dedupeKey(dedupeKey)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Persisted in-app notification id {} for user {}", saved.getId(), user.getId());

        // Publish internal event for transactional after-commit real-time WebSocket delivery
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new NotificationCreatedEvent(this, saved, user.getEmail()));
        }

        // Dispatch through external channels asynchronously or without rolling back the transaction
        tryDispatchExternalChannels(user, title, message);

        return notificationMapper.toResponse(saved);
    }

    private void tryDispatchExternalChannels(User user, String title, String message) {
        if (user == null) {
            return;
        }

        // Email notifications preference check (default true)
        boolean emailEnabled = user.getEmailNotificationsEnabled() == null || Boolean.TRUE.equals(user.getEmailNotificationsEnabled());
        if (!emailEnabled) {
            log.info("Email notifications are disabled by user {} preferences. Suppressing email.", user.getId());
        } else {
            CompletableFuture.runAsync(() -> {
                try {
                    if (user.getEmail() != null && !user.getEmail().isBlank()) {
                        String recipientName = (user.getFirstName() != null && !user.getFirstName().isBlank())
                                ? user.getFirstName()
                                : null;
                        String htmlBody = emailTemplateService.buildNotificationEmail(
                                recipientName,
                                title,
                                message,
                                "View in App",
                                "https://pawconnect.app/notifications"
                        );
                        emailService.sendEmail(user.getEmail(), title, htmlBody);
                        log.debug("Dispatched notification email to {}", user.getEmail());
                    }
                } catch (Exception ex) {
                    log.warn("Failed to dispatch external email notification for user {}: {}", user.getId(), ex.getMessage());
                }
            });
        }

        try {
            if (user.getPhone() != null && !user.getPhone().isBlank()) {
                smsService.sendSms(user.getPhone(), title + ": " + message);
                log.debug("Dispatched notification SMS to {}", user.getPhone());
            }
        } catch (Exception ex) {
            log.warn("Failed to dispatch external SMS notification for user {}: {}", user.getId(), ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUserNotifications(Long userId, Boolean unreadOnly, Pageable pageable) {
        Pageable effectivePageable = pageable;
        if (pageable == null) {
            effectivePageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        } else if (pageable.getSort().isUnsorted()) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        }

        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findByUserIdAndIsRead(userId, false, effectivePageable);
        } else {
            page = notificationRepository.findByUserId(userId, effectivePageable);
        }

        return PageResponse.from(page.map(notificationMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return UnreadCountResponse.builder().unreadCount(count).build();
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: you do not own this notification");
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return notificationMapper.toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        log.info("Marked all notifications as read for user {}", userId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied: you do not own this notification");
        }

        notificationRepository.delete(notification);
        log.info("Deleted notification {} for user {}", notificationId, userId);
    }

    // ─── ADMIN BROADCAST ANNOUNCEMENT CAPABILITIES ──────────────────────────────

    @Override
    @Transactional
    public BroadcastAnnouncementResponse createBroadcast(CreateBroadcastRequest request, User adminUser) {
        String normalizedAudience = normalizeAudience(request.resolveAudience());
        List<User> targetUsers = resolveTargetUsers(normalizedAudience);

        Instant now = Instant.now();
        BroadcastAnnouncement broadcast = BroadcastAnnouncement.builder()
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .targetAudience(normalizedAudience)
                .dispatchStatus("SENT")
                .recipientCount(targetUsers.size())
                .createdByUserId(adminUser != null ? adminUser.getId() : null)
                .sentAt(now)
                .createdAt(now)
                .build();

        BroadcastAnnouncement savedBroadcast = broadcastAnnouncementRepository.save(broadcast);
        log.info("Persisted broadcast announcement id: {} for audience: {} ({} recipients)",
                savedBroadcast.getId(), normalizedAudience, targetUsers.size());

        // Fan-out notifications to targeted users
        dispatchBroadcastToUsers(savedBroadcast, targetUsers);

        // Audit log
        if (auditLogService != null && adminUser != null) {
            try {
                auditLogService.recordAudit(
                        adminUser,
                        "SEND_BROADCAST",
                        "NOTIFICATION",
                        "BROADCAST",
                        savedBroadcast.getId(),
                        null,
                        "{\"title\":\"" + savedBroadcast.getTitle() + "\",\"audience\":\"" + normalizedAudience + "\",\"recipients\":" + targetUsers.size() + "}",
                        null,
                        null
                );
            } catch (Exception ex) {
                log.warn("Failed to record audit log for broadcast announcement {}: {}", savedBroadcast.getId(), ex.getMessage());
            }
        }

        return mapToBroadcastResponse(savedBroadcast);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BroadcastAnnouncementResponse> getAllBroadcasts(Pageable pageable, String search, String audience) {
        Specification<BroadcastAnnouncement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), term),
                        cb.like(cb.lower(root.get("message")), term)
                ));
            }
            if (audience != null && !audience.isBlank() && !audience.equalsIgnoreCase("all")) {
                String norm = normalizeAudience(audience);
                predicates.add(cb.equal(root.get("targetAudience"), norm));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BroadcastAnnouncement> page = broadcastAnnouncementRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::mapToBroadcastResponse));
    }

    @Override
    @Transactional
    public BroadcastAnnouncementResponse resendBroadcast(Long id, User adminUser) {
        BroadcastAnnouncement broadcast = broadcastAnnouncementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broadcast announcement not found with id: " + id));

        List<User> targetUsers = resolveTargetUsers(broadcast.getTargetAudience());
        broadcast.setSentAt(Instant.now());
        broadcast.setRecipientCount(targetUsers.size());
        broadcast.setDispatchStatus("SENT");
        BroadcastAnnouncement updated = broadcastAnnouncementRepository.save(broadcast);

        for (User user : targetUsers) {
            try {
                Notification notification = Notification.builder()
                        .user(user)
                        .notificationType(NotificationType.SYSTEM)
                        .dedupeKey("BROADCAST:" + updated.getId() + ":RESEND:" + System.currentTimeMillis() + ":USER:" + user.getId())
                        .title(updated.getTitle())
                        .message(updated.getMessage())
                        .referenceType("BROADCAST")
                        .referenceId(updated.getId())
                        .isRead(false)
                        .build();

                Notification savedNotif = notificationRepository.save(notification);
                if (eventPublisher != null) {
                    eventPublisher.publishEvent(new NotificationCreatedEvent(this, savedNotif, user.getEmail()));
                }
                tryDispatchExternalChannels(user, updated.getTitle(), updated.getMessage());
            } catch (Exception ex) {
                log.warn("Could not resend broadcast notification to user {}: {}", user.getId(), ex.getMessage());
            }
        }

        if (auditLogService != null && adminUser != null) {
            try {
                auditLogService.recordAudit(
                        adminUser,
                        "RESEND_BROADCAST",
                        "NOTIFICATION",
                        "BROADCAST",
                        updated.getId(),
                        null,
                        "{\"resend\":true,\"recipients\":" + targetUsers.size() + "}",
                        null,
                        null
                );
            } catch (Exception ignored) {}
        }

        return mapToBroadcastResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBroadcast(Long id, User adminUser) {
        BroadcastAnnouncement broadcast = broadcastAnnouncementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broadcast announcement not found with id: " + id));

        notificationRepository.deleteByReferenceTypeAndReferenceId("BROADCAST", id);
        broadcastAnnouncementRepository.delete(broadcast);
        log.info("Deleted broadcast announcement id: {} by admin: {}", id, adminUser != null ? adminUser.getId() : "SYSTEM");

        if (auditLogService != null && adminUser != null) {
            try {
                auditLogService.recordAudit(
                        adminUser,
                        "DELETE_BROADCAST",
                        "NOTIFICATION",
                        "BROADCAST",
                        id,
                        "{\"title\":\"" + broadcast.getTitle() + "\"}",
                        null,
                        null,
                        null
                );
            } catch (Exception ignored) {}
        }
    }

    private void dispatchBroadcastToUsers(BroadcastAnnouncement broadcast, List<User> targetUsers) {
        for (User user : targetUsers) {
            try {
                String dedupeKey = "BROADCAST:" + broadcast.getId() + ":USER:" + user.getId();
                if (notificationRepository.existsByDedupeKey(dedupeKey)) {
                    continue;
                }
                Notification notification = Notification.builder()
                        .user(user)
                        .notificationType(NotificationType.SYSTEM)
                        .dedupeKey(dedupeKey)
                        .title(broadcast.getTitle())
                        .message(broadcast.getMessage())
                        .referenceType("BROADCAST")
                        .referenceId(broadcast.getId())
                        .isRead(false)
                        .build();

                Notification savedNotif = notificationRepository.save(notification);

                if (eventPublisher != null) {
                    eventPublisher.publishEvent(new NotificationCreatedEvent(this, savedNotif, user.getEmail()));
                }

                tryDispatchExternalChannels(user, broadcast.getTitle(), broadcast.getMessage());
            } catch (Exception ex) {
                log.warn("Could not dispatch broadcast notification to user {}: {}", user.getId(), ex.getMessage());
            }
        }
    }

    private List<User> resolveTargetUsers(String normalizedAudience) {
        List<User> users;
        switch (normalizedAudience) {
            case "PET_OWNER":
                users = userRepository.findByRoleCodeAndStatus("PET_OWNER", UserStatus.ACTIVE);
                if (users.isEmpty()) {
                    users = userRepository.findByRoleCode("PET_OWNER");
                }
                break;
            case "VETERINARIAN":
                users = userRepository.findByRoleCodeAndStatus("VETERINARIAN", UserStatus.ACTIVE);
                if (users.isEmpty()) {
                    users = userRepository.findByRoleCode("VETERINARIAN");
                }
                break;
            case "SERVICE_PROVIDER":
                users = userRepository.findByRoleCodeAndStatus("SERVICE_PROVIDER", UserStatus.ACTIVE);
                if (users.isEmpty()) {
                    users = userRepository.findByRoleCode("SERVICE_PROVIDER");
                }
                break;
            case "ALL":
            default:
                users = userRepository.findByStatus(UserStatus.ACTIVE);
                if (users.isEmpty()) {
                    users = userRepository.findAll();
                }
                break;
        }
        return users != null ? users : List.of();
    }

    private String normalizeAudience(String raw) {
        if (raw == null || raw.isBlank()) {
            return "ALL";
        }
        String s = raw.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (s.equals("ALL") || s.equals("ALL_USERS") || s.equals("MEMBERS") || s.equals("PLATFORM")) {
            return "ALL";
        }
        if (s.contains("PET") || s.contains("OWNER") || s.contains("CUSTOMER")) {
            return "PET_OWNER";
        }
        if (s.contains("VET")) {
            return "VETERINARIAN";
        }
        if (s.contains("SERVICE") || s.contains("PROVIDER")) {
            return "SERVICE_PROVIDER";
        }
        return "ALL";
    }

    private BroadcastAnnouncementResponse mapToBroadcastResponse(BroadcastAnnouncement b) {
        return BroadcastAnnouncementResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .message(b.getMessage())
                .targetAudience(b.getTargetAudience())
                .dispatchStatus(b.getDispatchStatus())
                .recipientCount(b.getRecipientCount() != null ? b.getRecipientCount() : 0)
                .createdByUserId(b.getCreatedByUserId())
                .sentAt(b.getSentAt())
                .createdAt(b.getCreatedAt())
                .type("announcement")
                .build();
    }
}
