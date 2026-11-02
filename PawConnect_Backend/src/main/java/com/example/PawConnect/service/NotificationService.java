package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.CreateBroadcastRequest;
import com.example.PawConnect.dto.response.admin.BroadcastAnnouncementResponse;
import com.example.PawConnect.dto.response.NotificationResponse;
import com.example.PawConnect.dto.response.UnreadCountResponse;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.User;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationResponse createNotification(
            User user,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId,
            String dedupeKey
    );

    PageResponse<NotificationResponse> getUserNotifications(Long userId, Boolean unreadOnly, Pageable pageable);

    UnreadCountResponse getUnreadCount(Long userId);

    NotificationResponse markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    void deleteNotification(Long notificationId, Long userId);

    BroadcastAnnouncementResponse createBroadcast(CreateBroadcastRequest request, User adminUser);

    PageResponse<BroadcastAnnouncementResponse> getAllBroadcasts(Pageable pageable, String search, String audience);

    BroadcastAnnouncementResponse resendBroadcast(Long id, User adminUser);

    void deleteBroadcast(Long id, User adminUser);
}
