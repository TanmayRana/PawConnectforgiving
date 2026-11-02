package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.notification.RealtimeNotificationPayload;
import com.example.PawConnect.service.WebSocketNotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationPublisherImpl implements WebSocketNotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publishToUser(String username, RealtimeNotificationPayload payload) {
        if (username == null || username.isBlank()) {
            log.warn("Cannot publish WebSocket notification: username is missing");
            return;
        }

        try {
            // Dispatches to user queue: Spring translates to /user/{username}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/notifications",
                    payload
            );
            log.info("Dispatched real-time notification id {} to destination for user: {}", payload.getId(), username);
        } catch (Exception ex) {
            // Failure to send WebSocket message must never compromise business transactions
            log.error("Failed to publish real-time notification to user {}: {}", username, ex.getMessage());
        }
    }
}
