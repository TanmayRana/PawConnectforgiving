package com.example.PawConnect.event;

import com.example.PawConnect.dto.response.notification.RealtimeNotificationPayload;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.service.WebSocketNotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final WebSocketNotificationPublisher webSocketNotificationPublisher;

    /**
     * Listens for notification creation events and dispatches real-time messages only AFTER
     * the underlying database transaction has successfully committed.
     * If the transaction rolls back, this listener is not executed.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleNotificationCreated(NotificationCreatedEvent event) {
        if (event == null) {
            return;
        }

        try {
            NotificationType type = null;
            if (event.getNotificationType() != null) {
                try {
                    type = NotificationType.valueOf(event.getNotificationType());
                } catch (Exception ignored) {
                }
            }

            RealtimeNotificationPayload payload = RealtimeNotificationPayload.builder()
                    .id(event.getNotificationId())
                    .userId(event.getUserId())
                    .notificationType(type)
                    .title(event.getTitle())
                    .message(event.getMessage())
                    .referenceType(event.getReferenceType())
                    .referenceId(event.getReferenceId())
                    .isRead(event.getIsRead())
                    .createdAt(event.getCreatedAt())
                    .build();

            webSocketNotificationPublisher.publishToUser(event.getUserEmail(), payload);
        } catch (Exception ex) {
            log.error("Error in NotificationEventListener while handling event for notification {}: {}",
                    event.getNotificationId(), ex.getMessage());
        }
    }
}
