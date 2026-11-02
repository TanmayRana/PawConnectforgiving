package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.CreatePromoCodeRequest;
import com.example.PawConnect.dto.request.admin.TogglePromoCodeStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdatePromoCodeRequest;
import com.example.PawConnect.dto.response.PromoCodeResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/promo-codes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPromoCodeController {

    private final PromoCodeService promoCodeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PromoCodeResponse>>> getPromoCodes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<PromoCodeResponse> response = promoCodeService.getPromoCodes(search, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> getPromoCodeById(@PathVariable Long id) {
        PromoCodeResponse response = promoCodeService.getPromoCodeById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PromoCodeResponse>> createPromoCode(
            @Valid @RequestBody CreatePromoCodeRequest request
    ) {
        PromoCodeResponse response = promoCodeService.createPromoCode(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> updatePromoCode(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePromoCodeRequest request
    ) {
        PromoCodeResponse response = promoCodeService.updatePromoCode(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> togglePromoCodeStatus(
            @PathVariable Long id,
            @RequestBody(required = false) TogglePromoCodeStatusRequest request
    ) {
        Boolean isActive = (request != null) ? request.getIsActive() : null;
        PromoCodeResponse response = promoCodeService.togglePromoCodeStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePromoCode(@PathVariable Long id) {
        promoCodeService.deletePromoCode(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Promo code deleted successfully"));
    }
}
