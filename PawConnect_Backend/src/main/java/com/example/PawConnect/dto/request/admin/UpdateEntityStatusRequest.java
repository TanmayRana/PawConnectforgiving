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
public class UpdateEntityStatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    private String reason;
}
