package com.example.PawConnect.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Getter
@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id:${application.razorpay.key-id:${RAZORPAY_KEY_ID:}}}")
    private String keyId;

    @Value("${razorpay.key.secret:${application.razorpay.key-secret:${RAZORPAY_KEY_SECRET:}}}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:${application.razorpay.webhook-secret:${RAZORPAY_WEBHOOK_SECRET:}}}")
    private String webhookSecret;

    @Value("${application.razorpay.mock-client:false}")
    private boolean mockClient;

    @Bean
    public RazorpayClient razorpayClient() {
        if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
            try {
                log.info("Initializing RazorpayClient with configured key ID: {}", keyId);
                return new RazorpayClient(keyId, keySecret);
            } catch (RazorpayException e) {
                log.warn("Failed to initialize RazorpayClient with credentials: {}. Falling back to default client.", e.getMessage());
            }
        }
        try {
            log.info("Initializing fallback RazorpayClient with placeholder credentials");
            return new RazorpayClient("rzp_test_placeholder", "dummy_secret_placeholder");
        } catch (RazorpayException e) {
            log.error("Unable to initialize fallback RazorpayClient: {}", e.getMessage());
            return null;
        }
    }
}
