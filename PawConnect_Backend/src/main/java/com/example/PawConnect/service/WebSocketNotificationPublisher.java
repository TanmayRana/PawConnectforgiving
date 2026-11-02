package com.example.PawConnect.service;

import com.example.PawConnect.dto.response.notification.RealtimeNotificationPayload;

public interface WebSocketNotificationPublisher {

    /**
     * Publishes a real-time notification payload to the authenticated user's private queue.
     * Destination pattern: /user/{username}/queue/notifications
     *
     * @param username the authenticated principal username (email)
     * @param payload the safe notification payload DTO
     */
    void publishToUser(String username, RealtimeNotificationPayload payload);
}
