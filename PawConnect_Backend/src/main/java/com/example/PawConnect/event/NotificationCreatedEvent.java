package com.example.PawConnect.event;

import com.example.PawConnect.model.Notification;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

@Getter
public class NotificationCreatedEvent extends ApplicationEvent {

    private final Long notificationId;
    private final Long userId;
    private final String userEmail;
    private final String notificationType;
    private final String title;
    private final String message;
    private final String referenceType;
    private final Long referenceId;
    private final Boolean isRead;
    private final LocalDateTime createdAt;

    public NotificationCreatedEvent(Object source, Notification notification, String userEmail) {
        super(source);
        this.notificationId = notification.getId();
        this.userId = notification.getUser() != null ? notification.getUser().getId() : null;
        this.userEmail = userEmail;
        this.notificationType = notification.getNotificationType() != null ? notification.getNotificationType().name() : null;
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.referenceType = notification.getReferenceType();
        this.referenceId = notification.getReferenceId();
        this.isRead = notification.getIsRead();
        this.createdAt = notification.getCreatedAt();
    }
}
