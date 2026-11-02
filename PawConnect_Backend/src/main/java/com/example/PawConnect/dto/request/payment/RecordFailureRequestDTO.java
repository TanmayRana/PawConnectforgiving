package com.example.PawConnect.dto.request.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordFailureRequestDTO {
    private String razorpayOrderId;
    private Long orderId;
    private Long bookingId;
    private String bookingType;
    private String reason;
}
