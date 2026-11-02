package com.example.PawConnect.dto;

import com.example.PawConnect.model.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long userId;
    private Long appointmentId;
    private Long serviceBookingId;
    private Long orderItemId;
    private Integer rating;
    private String reviewText;
    private ReviewStatus status;
}
