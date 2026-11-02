package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.AddressResponse;
import com.example.PawConnect.model.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressResponse toResponse(Address address) {
        if (address == null) {
            return null;
        }

        Long userId = null;
        if (address.getUser() != null) {
            userId = address.getUser().getId();
        }

        return AddressResponse.builder()
                .id(address.getId())
                .userId(userId)
                .addressType(address.getAddressType())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isDefault(Boolean.TRUE.equals(address.getIsDefault()))
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
