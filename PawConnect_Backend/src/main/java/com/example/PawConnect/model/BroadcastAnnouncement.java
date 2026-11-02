package com.example.PawConnect.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "broadcast_announcements", indexes = {
    @Index(name = "idx_broadcast_created_at", columnList = "created_at"),
    @Index(name = "idx_broadcast_target_audience", columnList = "target_audience")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString
public class BroadcastAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "target_audience", nullable = false, length = 100)
    private String targetAudience;

    @Column(name = "dispatch_status", nullable = false, length = 50)
    @Builder.Default
    private String dispatchStatus = "SENT";

    @Column(name = "recipient_count")
    @Builder.Default
    private Integer recipientCount = 0;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.sentAt == null) {
            this.sentAt = now;
        }
        if (this.dispatchStatus == null || this.dispatchStatus.isBlank()) {
            this.dispatchStatus = "SENT";
        }
        if (this.recipientCount == null) {
            this.recipientCount = 0;
        }
    }
}
