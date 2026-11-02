package com.example.PawConnect.dto.response.admin;

import com.example.PawConnect.model.ReportStatus;
import com.example.PawConnect.model.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private Long id;
    private Long reportedById;
    private String reportedByName;
    private String reportedByEmail;
    private ReportType reportType;
    private String targetType;
    private Long targetId;
    private String reason;
    private String description;
    private ReportStatus status;
    private Long assignedToId;
    private String assignedToName;
    private String resolutionNote;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
