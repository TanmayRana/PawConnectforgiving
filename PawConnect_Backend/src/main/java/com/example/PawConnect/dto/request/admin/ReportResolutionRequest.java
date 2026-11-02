package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.ReportStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResolutionRequest {

    @NotNull(message = "Report status is required")
    private ReportStatus status;

    @NotBlank(message = "Resolution note is required")
    private String resolutionNote;
}
