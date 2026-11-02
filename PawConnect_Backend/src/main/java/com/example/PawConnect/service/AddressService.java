package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.address.CreateAddressRequest;
import com.example.PawConnect.dto.request.address.UpdateAddressRequest;
import com.example.PawConnect.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getCurrentUserAddresses();

    AddressResponse getAddressById(Long addressId);

    AddressResponse createAddress(CreateAddressRequest request);

    AddressResponse updateAddress(Long addressId, UpdateAddressRequest request);

    void deleteAddress(Long addressId);

    AddressResponse setDefaultAddress(Long addressId);
}
