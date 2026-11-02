package com.example.PawConnect.dto;

import com.example.PawConnect.model.ReportStatus;
import com.example.PawConnect.model.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDto {
    private Long id;
    private Long reportedById;
    private ReportType reportType;
    private String targetType;
    private Long targetId;
    private String reason;
    private String description;
    private ReportStatus status;
    private Long assignedToId;
    private String resolutionNote;
}
