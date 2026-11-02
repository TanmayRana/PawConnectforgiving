package com.example.PawConnect.dto.response.admin;

import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.model.ServiceProviderVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminServiceProviderResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userPhone;
    private ProviderType providerType;
    private String businessName;
    private String description;
    private String phone;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer experienceYears;
    private ServiceProviderVerificationStatus verificationStatus;
    private Boolean isActive;
    private String profileImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
