package com.example.PawConnect.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String action;
    private String module;
    private String entityType;
    private Long entityId;
    private String oldData;
    private String newData;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
