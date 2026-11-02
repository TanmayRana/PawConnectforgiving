package com.example.PawConnect.dto;

import com.example.PawConnect.model.VeterinarianVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VeterinarianDto {
    private Long id;
    private Long userId;
    private String specialization;
    private String qualification;
    private String licenseNumber;
    private Integer experienceYears;
    private String clinicName;
    private String clinicAddress;
    private BigDecimal clinicLatitude;
    private BigDecimal clinicLongitude;
    private BigDecimal consultationFee;
    private String bio;
    private VeterinarianVerificationStatus verificationStatus;
    private Boolean isActive;
}
