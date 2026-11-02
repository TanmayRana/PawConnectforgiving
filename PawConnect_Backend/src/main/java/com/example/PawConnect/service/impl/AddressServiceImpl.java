package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.address.CreateAddressRequest;
import com.example.PawConnect.dto.request.address.UpdateAddressRequest;
import com.example.PawConnect.dto.response.AddressResponse;
import com.example.PawConnect.mapper.AddressMapper;
import com.example.PawConnect.model.Address;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.AddressRepository;
import com.example.PawConnect.service.AddressService;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final AddressRepository addressRepository;
    private final AddressMapper addressMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getCurrentUserAddresses() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(currentUserId);
        return addresses.stream()
                .map(addressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(Long addressId) {
        Address address = authorizationService.getAddressAndRequireOwner(addressId);
        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse createAddress(CreateAddressRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Long userId = currentUser.getId();

        long count = addressRepository.countByUserId(userId);
        boolean shouldBeDefault = count == 0 || Boolean.TRUE.equals(request.getIsDefault());

        if (shouldBeDefault) {
            addressRepository.clearDefaultAddresses(userId);
        }

        Address address = Address.builder()
                .user(currentUser)
                .addressType(request.getAddressType())
                .recipientName(request.getRecipientName().trim())
                .phone(request.getPhone().trim())
                .addressLine1(request.getAddressLine1().trim())
                .addressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null)
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode().trim())
                .country(request.getCountry().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(shouldBeDefault)
                .build();

        Address saved = addressRepository.save(address);
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long addressId, UpdateAddressRequest request) {
        Address address = authorizationService.getAddressAndRequireOwner(addressId);
        Long userId = address.getUser().getId();

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.clearDefaultAddresses(userId);
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault()) && Boolean.TRUE.equals(address.getIsDefault())) {
            // If customer tries to unset default on the current default address:
            List<Address> otherAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                    .stream()
                    .filter(a -> !a.getId().equals(addressId))
                    .toList();

            if (!otherAddresses.isEmpty()) {
                address.setIsDefault(false);
                Address promoted = otherAddresses.get(0);
                promoted.setIsDefault(true);
                addressRepository.save(promoted);
            } else {
                // Only address cannot be unset as default
                address.setIsDefault(true);
            }
        }

        address.setAddressType(request.getAddressType());
        address.setRecipientName(request.getRecipientName().trim());
        address.setPhone(request.getPhone().trim());
        address.setAddressLine1(request.getAddressLine1().trim());
        address.setAddressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null);
        address.setCity(request.getCity().trim());
        address.setState(request.getState().trim());
        address.setPostalCode(request.getPostalCode().trim());
        address.setCountry(request.getCountry().trim());
        if (request.getLatitude() != null) {
            address.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            address.setLongitude(request.getLongitude());
        }

        Address saved = addressRepository.save(address);
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(Long addressId) {
        Address address = authorizationService.getAddressAndRequireOwner(addressId);
        Long userId = address.getUser().getId();
        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());

        addressRepository.delete(address);
        addressRepository.flush();

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address promoted = remaining.get(0);
                promoted.setIsDefault(true);
                addressRepository.save(promoted);
            }
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long addressId) {
        Address address = authorizationService.getAddressAndRequireOwner(addressId);
        Long userId = address.getUser().getId();

        addressRepository.clearDefaultAddresses(userId);
        address.setIsDefault(true);

        Address saved = addressRepository.save(address);
        return addressMapper.toResponse(saved);
    }
}
