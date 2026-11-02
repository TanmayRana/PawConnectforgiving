package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.CartStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {
    private Long id;
    private Long userId;
    private CartStatus status;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private Integer totalItems;
}
