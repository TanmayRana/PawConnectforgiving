package com.example.PawConnect.dto.request.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequestDTO {

    // Target item references (at least one may be provided)
    private Long productId;
    private Long orderId;
    private Long bookingId;
    private String bookingType; // "VETERINARY" or "SERVICE"

    @Builder.Default
    private Integer quantity = 1;

    private String currency;
    private String receipt;
    private String preferredMethod;
    private Map<String, String> notes;
}
