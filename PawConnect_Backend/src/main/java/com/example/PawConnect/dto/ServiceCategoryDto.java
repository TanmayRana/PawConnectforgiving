package com.example.PawConnect.dto;

import com.example.PawConnect.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCategoryDto {
    private Long id;
    private String name;
    private ServiceType serviceType;
    private String description;
    private Boolean isActive;
}
