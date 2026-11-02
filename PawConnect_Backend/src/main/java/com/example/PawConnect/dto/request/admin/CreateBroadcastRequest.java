package com.example.PawConnect.dto.request.admin;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBroadcastRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @JsonAlias({"audience", "targetRole", "role"})
    private String targetAudience;

    private String type;

    public String resolveAudience() {
        if (targetAudience != null && !targetAudience.isBlank()) {
            return targetAudience.trim();
        }
        return "ALL";
    }
}
