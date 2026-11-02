package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.PlatformSettingRequest;
import com.example.PawConnect.dto.response.admin.PlatformSettingResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.PlatformSetting;
import com.example.PawConnect.repository.PlatformSettingRepository;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.PlatformSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformSettingServiceImpl implements PlatformSettingService {

    private final PlatformSettingRepository platformSettingRepository;
    private final AuditLogService auditLogService;

    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
            "tax_rate",
            "delivery_fee",
            "shipping_fee",
            "free_delivery_threshold",
            "free_shipping_threshold",
            "cancellation_fee_hours",
            "platform_currency",
            "maintenance_mode",
            "consultation_platform_fee"
    );

    private static final Set<String> FORBIDDEN_KEY_FRAGMENTS = Set.of(
            "SECRET", "PASSWORD", "DATABASE", "TOKEN", "JWT", "KEY", "CREDENTIAL", "GATEWAY"
    );

    @Override
    @Transactional(readOnly = true)
    public List<PlatformSettingResponse> getAllSettings() {
        return platformSettingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformSettingResponse getSettingByKey(String key) {
        validateKeyAllowed(key);
        PlatformSetting setting = platformSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Platform setting not found for key: " + key));
        return mapToResponse(setting);
    }

    @Override
    @Transactional
    public PlatformSettingResponse updateSetting(String key, PlatformSettingRequest request) {
        validateKeyAllowed(key);

        if (request.getSettingKey() != null && !request.getSettingKey().trim().equalsIgnoreCase(key.trim())) {
            throw new IllegalArgumentException("Payload setting key '" + request.getSettingKey() + "' does not match path key '" + key + "'");
        }

        validateSettingValue(key, request.getSettingValue());

        PlatformSetting setting = platformSettingRepository.findBySettingKey(key)
                .orElse(PlatformSetting.builder()
                        .settingKey(key)
                        .description(request.getDescription())
                        .build());

        String oldVal = setting.getSettingValue();
        setting.setSettingValue(request.getSettingValue().trim());
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            setting.setDescription(request.getDescription().trim());
        }

        PlatformSetting saved = platformSettingRepository.save(setting);

        // Audit log
        String oldSnapshot = oldVal != null ? "{\"settingKey\":\"" + key + "\",\"settingValue\":\"" + oldVal + "\"}" : "null";
        String newSnapshot = "{\"settingKey\":\"" + key + "\",\"settingValue\":\"" + saved.getSettingValue() + "\"}";
        auditLogService.logAction(
                "PLATFORM_SETTING_UPDATED",
                "SETTINGS",
                "PLATFORM_SETTING",
                saved.getId(),
                oldSnapshot,
                newSnapshot
        );

        log.info("Platform setting '{}' updated successfully to '{}'", key, saved.getSettingValue());
        return mapToResponse(saved);
    }

    private void validateKeyAllowed(String key) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Setting key cannot be null or blank");
        }
        String normalizedKey = key.trim().toLowerCase();

        for (String forbidden : FORBIDDEN_KEY_FRAGMENTS) {
            if (key.toUpperCase().contains(forbidden)) {
                throw new BusinessRuleException("Security violation: Setting key contains restricted pattern '" + forbidden + "'");
            }
        }

        if (!ALLOWED_SETTING_KEYS.contains(normalizedKey)) {
            throw new IllegalArgumentException("Unsupported platform setting key '" + key + "'. Allowed keys: " + ALLOWED_SETTING_KEYS);
        }
    }

    private void validateSettingValue(String key, String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Setting value cannot be blank");
        }
        String trimmed = value.trim();

        switch (key.toLowerCase()) {
            case "tax_rate":
                try {
                    BigDecimal rate = new BigDecimal(trimmed);
                    if (rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(new BigDecimal("100.00")) > 0) {
                        throw new IllegalArgumentException("tax_rate must be between 0.00 and 100.00 percent");
                    }
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("tax_rate must be a valid decimal number");
                }
                break;

            case "delivery_fee":
            case "shipping_fee":
            case "free_delivery_threshold":
            case "free_shipping_threshold":
            case "consultation_platform_fee":
                try {
                    BigDecimal fee = new BigDecimal(trimmed);
                    if (fee.compareTo(BigDecimal.ZERO) < 0) {
                        throw new IllegalArgumentException(key + " must be a non-negative decimal number");
                    }
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(key + " must be a valid decimal number");
                }
                break;

            case "cancellation_fee_hours":
                try {
                    int hours = Integer.parseInt(trimmed);
                    if (hours < 0 || hours > 720) { // max 30 days
                        throw new IllegalArgumentException("cancellation_fee_hours must be between 0 and 720");
                    }
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("cancellation_fee_hours must be a valid integer");
                }
                break;

            case "platform_currency":
                if (!trimmed.matches("^[A-Z]{3}$")) {
                    throw new IllegalArgumentException("platform_currency must be a 3-letter uppercase currency code (e.g. INR, USD)");
                }
                break;

            case "maintenance_mode":
                if (!trimmed.equalsIgnoreCase("true") && !trimmed.equalsIgnoreCase("false")) {
                    throw new IllegalArgumentException("maintenance_mode must be 'true' or 'false'");
                }
                break;

            default:
                break;
        }
    }

    private PlatformSettingResponse mapToResponse(PlatformSetting setting) {
        return PlatformSettingResponse.builder()
                .id(setting.getId())
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
