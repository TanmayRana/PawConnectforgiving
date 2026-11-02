package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.ProviderType;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicServiceProviderResponse {
    private Long id;
    private String name;
    private ProviderType providerType;
    private String businessName;
    private String description;
    private String phone;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer experienceYears;
    private Double rating;
    private Long reviewCount;
    private String profileImageUrl;
}
