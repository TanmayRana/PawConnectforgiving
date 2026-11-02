package com.example.PawConnect.controller;

import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@Tag(name = "Webhooks", description = "Gateway server-to-server webhook event notification endpoints")
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    public RazorpayWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/razorpay")
    @Operation(summary = "Receive and process server-to-server webhook notifications from Razorpay")
    public ResponseEntity<ApiResponse<Void>> handleRazorpayWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader
    ) {
        log.info("Received Razorpay webhook event notification");
        paymentService.processWebhook(rawPayload, signatureHeader);
        return ResponseEntity.ok(ApiResponse.ok(null, "Webhook processed successfully"));
    }
}
