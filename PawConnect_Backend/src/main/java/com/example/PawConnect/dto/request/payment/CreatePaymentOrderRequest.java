package com.example.PawConnect.dto.request.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentOrderRequest {

    // Optional booking type ("VETERINARY" or "SERVICE") if not implied by endpoint route
    private String bookingType;

    // Optional preferred method ("UPI", "CARD", "NETBANKING")
    private String preferredMethod;
}
