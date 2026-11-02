package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchOrderStatusResponse {
    private int totalRequested;
    private int updatedCount;
    private int skippedCount;
    private List<Long> updatedOrderIds;
    private List<String> skippedReasons;
}
