package com.example.PawConnect.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSettingRequest {

    @NotBlank(message = "Setting key is required")
    @Size(max = 100, message = "Setting key cannot exceed 100 characters")
    private String settingKey;

    @NotBlank(message = "Setting value is required")
    private String settingValue;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
}
