package com.example.PawConnect.dto;

import com.example.PawConnect.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistoryDto {
    private Long id;
    private Long orderId;
    private OrderStatus status;
    private Long changedBy;
    private String remarks;
}
