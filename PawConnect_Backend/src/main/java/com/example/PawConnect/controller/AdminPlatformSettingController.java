package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.PlatformSettingRequest;
import com.example.PawConnect.dto.response.admin.PlatformSettingResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.PlatformSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPlatformSettingController {

    private final PlatformSettingService platformSettingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlatformSettingResponse>>> getAllSettings() {
        List<PlatformSettingResponse> settings = platformSettingService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<PlatformSettingResponse>> getSettingByKey(@PathVariable String key) {
        PlatformSettingResponse setting = platformSettingService.getSettingByKey(key);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<PlatformSettingResponse>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody PlatformSettingRequest request
    ) {
        PlatformSettingResponse setting = platformSettingService.updateSetting(key, request);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }
}
