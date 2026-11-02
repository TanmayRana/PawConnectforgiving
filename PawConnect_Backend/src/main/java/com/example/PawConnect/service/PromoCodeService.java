package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.CreatePromoCodeRequest;
import com.example.PawConnect.dto.request.admin.UpdatePromoCodeRequest;
import com.example.PawConnect.dto.response.PromoCodeResponse;
import com.example.PawConnect.dto.response.PromoValidationResponse;
import com.example.PawConnect.model.PromoCode;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface PromoCodeService {

    // Admin Operations
    PromoCodeResponse createPromoCode(CreatePromoCodeRequest request);

    PromoCodeResponse updatePromoCode(Long id, UpdatePromoCodeRequest request);

    PromoCodeResponse togglePromoCodeStatus(Long id, Boolean isActive);

    void deletePromoCode(Long id);

    PageResponse<PromoCodeResponse> getPromoCodes(String search, Boolean isActive, Pageable pageable);

    PromoCodeResponse getPromoCodeById(Long id);

    // Customer Operations & Financials
    PromoValidationResponse validatePromoCodeForCart(Long userId, String code);

    void validatePromoCode(PromoCode promo, Long userId, BigDecimal subtotal);

    BigDecimal calculateDiscount(PromoCode promo, BigDecimal subtotal);
}
