package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistoryResponse {
    private Long id;
    private OrderStatus status;
    private String changedByName;
    private String remarks;
    private LocalDateTime changedAt;
}
