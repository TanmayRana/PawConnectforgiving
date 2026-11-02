package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewModerationRequest {

    @NotNull(message = "Review status is required")
    private ReviewStatus status;

    private String moderationNote;
}
