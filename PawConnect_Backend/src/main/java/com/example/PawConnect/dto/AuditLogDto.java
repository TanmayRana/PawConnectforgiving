package com.example.PawConnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDto {
    private Long id;
    private Long userId;
    private String action;
    private String module;
    private String entityType;
    private Long entityId;
    private String oldData;
    private String newData;
    private String ipAddress;
    private String userAgent;
}
