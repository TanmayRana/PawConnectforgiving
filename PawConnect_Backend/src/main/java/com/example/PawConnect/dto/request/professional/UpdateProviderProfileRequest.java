package com.example.PawConnect.dto.request.professional;

import com.example.PawConnect.model.ProviderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProviderProfileRequest {

    @NotNull(message = "Provider type is required")
    private ProviderType providerType;

    @NotBlank(message = "Business name is required")
    @Size(max = 200, message = "Business name cannot exceed 200 characters")
    private String businessName;

    private String description;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be a valid 10-15 digit number")
    private String phone;

    private String address;

    @PositiveOrZero(message = "Experience years must be zero or positive")
    private Integer experienceYears;
}
