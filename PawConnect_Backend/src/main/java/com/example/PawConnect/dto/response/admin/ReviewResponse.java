package com.example.PawConnect.dto.response.admin;

import com.example.PawConnect.model.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long appointmentId;
    private Long serviceBookingId;
    private Long orderItemId;
    private Integer rating;
    private String reviewText;
    private ReviewStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
