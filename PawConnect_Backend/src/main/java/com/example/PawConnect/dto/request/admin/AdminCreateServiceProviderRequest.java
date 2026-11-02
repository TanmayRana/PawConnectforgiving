package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.ProviderType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCreateServiceProviderRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name cannot exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be a valid 10-15 digit number")
    private String phone;

    @Size(max = 100, message = "Password cannot exceed 100 characters")
    private String password;

    @NotNull(message = "Provider type is required (GROOMER or TRAINER)")
    private ProviderType providerType;

    @NotBlank(message = "Business name is required")
    @Size(max = 200, message = "Business name cannot exceed 200 characters")
    private String businessName;

    private String description;

    @NotBlank(message = "Business contact phone is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Business phone must be a valid 10-15 digit number")
    private String businessPhone;

    private String address;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private BigDecimal longitude;

    @Min(value = 0, message = "Experience years cannot be negative")
    private Integer experienceYears;

    @Size(max = 500, message = "Profile image URL cannot exceed 500 characters")
    private String profileImage;

    private Boolean isActive;
}
