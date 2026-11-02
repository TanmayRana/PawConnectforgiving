package com.example.PawConnect.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRequest {

    @NotNull(message = "Approved decision is required")
    private Boolean approved;

    private String rejectionReason;
}
