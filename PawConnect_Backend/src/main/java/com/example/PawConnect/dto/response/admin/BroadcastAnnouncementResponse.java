package com.example.PawConnect.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastAnnouncementResponse {

    private Long id;
    private String title;
    private String message;
    private String targetAudience;
    private String dispatchStatus;
    private Integer recipientCount;
    private Long createdByUserId;
    private Instant sentAt;
    private Instant createdAt;

    @Builder.Default
    private String type = "announcement";

    @JsonProperty("audience")
    public String getAudience() {
        if (targetAudience == null) return "all";
        String lower = targetAudience.toLowerCase().trim();
        if (lower.contains("pet")) return "pet_owners";
        if (lower.contains("vet")) return "veterinarians";
        if (lower.contains("service") || lower.contains("provider")) return "service_providers";
        return "all";
    }

    @JsonProperty("status")
    public String getStatus() {
        return dispatchStatus != null ? dispatchStatus.toLowerCase() : "sent";
    }

    @JsonProperty("sentTimestamp")
    public Instant getSentTimestamp() {
        return sentAt != null ? sentAt : createdAt;
    }
}
