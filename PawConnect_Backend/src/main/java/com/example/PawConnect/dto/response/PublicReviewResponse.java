package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicReviewResponse {
    private Long id;
    private String reviewerName;
    private Integer rating;
    private String reviewText;
    private LocalDateTime createdAt;
    private String targetType;
    private Long targetId;
    private String targetTitle;
}
