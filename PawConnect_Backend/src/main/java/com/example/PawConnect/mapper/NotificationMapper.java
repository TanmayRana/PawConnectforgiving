package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.NotificationResponse;
import com.example.PawConnect.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) {
            return null;
        }

        Long userId = notification.getUser() != null ? notification.getUser().getId() : null;

        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(userId)
                .notificationType(notification.getNotificationType())
                .dedupeKey(notification.getDedupeKey())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
