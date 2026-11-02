package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.address.CreateAddressRequest;
import com.example.PawConnect.dto.request.address.UpdateAddressRequest;
import com.example.PawConnect.dto.response.AddressResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me/addresses")
@RequiredArgsConstructor
@Tag(name = "Customer Addresses", description = "Customer address book and default delivery address management")
@PreAuthorize("isAuthenticated()")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "List current user's saved delivery addresses (default first)")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses() {
        List<AddressResponse> response = addressService.getCurrentUserAddresses();
        return ResponseEntity.ok(ApiResponse.ok(response, "Addresses retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Save a new delivery address")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(@Valid @RequestBody CreateAddressRequest request) {
        AddressResponse response = addressService.createAddress(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Address created successfully"));
    }

    @GetMapping("/{addressId}")
    @Operation(summary = "Get address details by ID")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(@PathVariable Long addressId) {
        AddressResponse response = addressService.getAddressById(addressId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Address retrieved successfully"));
    }

    @PutMapping("/{addressId}")
    @Operation(summary = "Update address by ID")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody UpdateAddressRequest request
    ) {
        AddressResponse response = addressService.updateAddress(addressId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Address updated successfully"));
    }

    @DeleteMapping("/{addressId}")
    @Operation(summary = "Delete address by ID")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable Long addressId) {
        addressService.deleteAddress(addressId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Address deleted successfully"));
    }

    @PatchMapping("/{addressId}/default")
    @Operation(summary = "Set address as the primary default address")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(@PathVariable Long addressId) {
        AddressResponse response = addressService.setDefaultAddress(addressId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Default address updated successfully"));
    }
}
