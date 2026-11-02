package com.example.PawConnect.service;

import com.example.PawConnect.dto.response.admin.AuditLogResponse;
import com.example.PawConnect.model.User;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AuditLogService {

    void recordAudit(User actor, String action, String module, String entityType, Long entityId, String oldData, String newData, String ipAddress, String userAgent);

    void logAction(String action, String module, String entityType, Long entityId, String oldData, String newData);

    PageResponse<AuditLogResponse> getAuditLogs(Long userId, String module, String action, String entityType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    AuditLogResponse getAuditLogById(Long id);
}
