package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.OrderStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchOrderStatusRequest {

    @NotEmpty(message = "orderIds must not be empty")
    private List<Long> orderIds;

    @NotNull(message = "orderStatus is required")
    private OrderStatus orderStatus;

    private String remarks;
    private String courierPartner;
    private String notes;
}
