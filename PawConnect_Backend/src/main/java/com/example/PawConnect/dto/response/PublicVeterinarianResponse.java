package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicVeterinarianResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
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
    private Double rating;
    private Long reviewCount;
    private Boolean isAvailableToday;
    private String profileImageUrl;
}
