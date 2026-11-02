package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.commerce.ApplyPromoRequest;
import com.example.PawConnect.dto.response.PromoValidationResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/promo-codes")
@RequiredArgsConstructor
public class CustomerPromoCodeController {

    private final PromoCodeService promoCodeService;
    private final CurrentUserService currentUserService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromoValidationResponse>> validatePromoCode(@Valid @RequestBody ApplyPromoRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        PromoValidationResponse response = promoCodeService.validatePromoCodeForCart(userId, request.getCode());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
