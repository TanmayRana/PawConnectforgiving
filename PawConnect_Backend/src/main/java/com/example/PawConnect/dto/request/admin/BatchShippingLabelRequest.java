package com.example.PawConnect.dto.request.admin;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchShippingLabelRequest {

    @NotEmpty(message = "orderIds must not be empty")
    private List<Long> orderIds;
}
