package com.example.PawConnect.dto.response.admin;

import com.example.PawConnect.model.VeterinarianVerificationStatus;
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
public class AdminVeterinarianResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userPhone;
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
    private String profileImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
