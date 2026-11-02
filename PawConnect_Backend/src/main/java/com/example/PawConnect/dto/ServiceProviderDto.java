package com.example.PawConnect.dto;

import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.model.ServiceProviderVerificationStatus;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceProviderDto {
    private Long id;
    private Long userId;
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
}
