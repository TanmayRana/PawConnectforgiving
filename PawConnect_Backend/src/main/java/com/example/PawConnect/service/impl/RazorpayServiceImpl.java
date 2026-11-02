package com.example.PawConnect.service.impl;

import com.example.PawConnect.config.RazorpayConfig;
import com.example.PawConnect.exception.PaymentException;
import com.example.PawConnect.service.RazorpayService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class RazorpayServiceImpl implements RazorpayService {

    private final RazorpayConfig razorpayConfig;
    private final RazorpayClient razorpayClient;

    public RazorpayServiceImpl(RazorpayConfig razorpayConfig, RazorpayClient razorpayClient) {
        this.razorpayConfig = razorpayConfig;
        this.razorpayClient = razorpayClient;
    }

    @Override
    public String createOrder(BigDecimal amount, String currency, String receipt, Map<String, String> notes) {
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        return createOrder(amountInPaise, currency, receipt, notes);
    }

    @Override
    public String createOrder(long amountInPaise, String currency, String receipt, Map<String, String> notes) {
        String keyId = razorpayConfig.getKeyId();
        String keySecret = razorpayConfig.getKeySecret();

        if (razorpayConfig.isMockClient() || keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            String mockOrderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.info("Mock Razorpay client generating order ID: {} for receipt: {} (amount: {} paise)", mockOrderId, receipt, amountInPaise);
            return mockOrderId;
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", (currency != null && !currency.isBlank()) ? currency : "INR");
            orderRequest.put("receipt", receipt);

            if (notes != null && !notes.isEmpty()) {
                JSONObject notesJson = new JSONObject();
                notes.forEach(notesJson::put);
                orderRequest.put("notes", notesJson);
            }

            RazorpayClient client = razorpayClient != null ? razorpayClient : new RazorpayClient(keyId, keySecret);
            Order order = client.orders.create(orderRequest);
            return order.get("id");
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new PaymentException("Payment gateway order creation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        String keySecret = razorpayConfig.getKeySecret();
        if (keySecret == null || keySecret.isBlank() || signature == null || signature.isBlank()) {
            return false;
        }
        try {
            // Reconstruct HMAC-SHA256 signature using orderId + "|" + paymentId and keySecret
            String data = orderId + "|" + paymentId;
            String expected = calculateHmacSha256(data, keySecret);
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    signature.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error verifying payment signature: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        String webhookSecret = razorpayConfig.getWebhookSecret();
        if (webhookSecret == null || webhookSecret.isBlank() || signature == null || signature.isBlank()) {
            return false;
        }
        try {
            // First attempt using official Razorpay Utils
            return Utils.verifyWebhookSignature(payload, signature.trim(), webhookSecret);
        } catch (RazorpayException e) {
            // Fallback to constant-time HMAC check if needed
            try {
                String expected = calculateHmacSha256(payload, webhookSecret);
                return MessageDigest.isEqual(
                        expected.getBytes(StandardCharsets.UTF_8),
                        signature.trim().getBytes(StandardCharsets.UTF_8)
                );
            } catch (Exception ex) {
                log.error("Error verifying webhook signature: {}", ex.getMessage());
                return false;
            }
        }
    }

    @Override
    public String generatePaymentSignature(String orderId, String paymentId) {
        String keySecret = razorpayConfig.getKeySecret();
        if (keySecret == null || keySecret.isBlank()) {
            return "sig_upi_" + UUID.randomUUID().toString().replace("-", "");
        }
        try {
            String data = orderId + "|" + paymentId;
            return calculateHmacSha256(data, keySecret);
        } catch (Exception e) {
            log.error("Error generating payment signature: {}", e.getMessage());
            return "sig_upi_" + UUID.randomUUID().toString().replace("-", "");
        }
    }

    @Override
    public String refundPayment(String paymentId, long amountInPaise, String reason) {
        String keyId = razorpayConfig.getKeyId();
        String keySecret = razorpayConfig.getKeySecret();

        if (razorpayConfig.isMockClient() || keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()
                || (paymentId != null && (paymentId.startsWith("pay_mock_") || paymentId.startsWith("pay_test_") || paymentId.startsWith("pay_hook_")))) {
            String mockRefundId = "rfnd_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.info("Mock Razorpay client processing refund: {} for payment: {} (amount: {} paise, reason: {})", mockRefundId, paymentId, amountInPaise, reason);
            return mockRefundId;
        }

        try {
            JSONObject refundRequest = new JSONObject();
            if (amountInPaise > 0) {
                refundRequest.put("amount", amountInPaise);
            }
            if (reason != null && !reason.isBlank()) {
                JSONObject notes = new JSONObject();
                notes.put("reason", reason);
                refundRequest.put("notes", notes);
            }

            RazorpayClient client = razorpayClient != null ? razorpayClient : new RazorpayClient(keyId, keySecret);
            com.razorpay.Refund refund = client.payments.refund(paymentId, refundRequest);
            return refund.get("id");
        } catch (RazorpayException e) {
            log.error("Razorpay refund failed: {}", e.getMessage());
            throw new PaymentException("Payment gateway refund failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String fetchOrderStatus(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            return null;
        }

        String keyId = razorpayConfig.getKeyId();
        String keySecret = razorpayConfig.getKeySecret();

        if (razorpayConfig.isMockClient() || keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()
                || orderId.startsWith("order_mock_") || orderId.startsWith("order_test_")) {
            log.debug("Mock or offline Razorpay client skipping order status query for: {}", orderId);
            return null;
        }

        try {
            RazorpayClient client = razorpayClient != null ? razorpayClient : new RazorpayClient(keyId, keySecret);
            com.razorpay.Order order = client.orders.fetch(orderId);
            if (order != null && order.has("status")) {
                return order.get("status");
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to fetch Razorpay order status for {}: {}", orderId, e.getMessage());
            return null;
        }
    }

    @Override
    public com.razorpay.Payment fetchPayment(String paymentId) {
        String keyId = razorpayConfig.getKeyId();
        String keySecret = razorpayConfig.getKeySecret();
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank() || paymentId == null || paymentId.isBlank()) {
            return null;
        }
        try {
            RazorpayClient client = razorpayClient != null ? razorpayClient : new RazorpayClient(keyId, keySecret);
            return client.payments.fetch(paymentId);
        } catch (Exception e) {
            log.warn("Failed to fetch Razorpay payment {}: {}", paymentId, e.getMessage());
            return null;
        }
    }

    @Override
    public boolean capturePayment(String paymentId, long amountInPaise) {
        String keyId = razorpayConfig.getKeyId();
        String keySecret = razorpayConfig.getKeySecret();
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank() || paymentId == null || paymentId.isBlank()) {
            return false;
        }
        try {
            RazorpayClient client = razorpayClient != null ? razorpayClient : new RazorpayClient(keyId, keySecret);
            JSONObject captureRequest = new JSONObject();
            captureRequest.put("amount", amountInPaise);
            captureRequest.put("currency", "INR");
            com.razorpay.Payment captured = client.payments.capture(paymentId, captureRequest);
            return captured != null && "captured".equals(captured.get("status"));
        } catch (Exception e) {
            log.warn("Failed to capture Razorpay payment {}: {}", paymentId, e.getMessage());
            return false;
        }
    }

    @Override
    public String getKeyId() {
        return razorpayConfig.getKeyId();
    }

    @Override
    public String getKeySecret() {
        return razorpayConfig.getKeySecret();
    }

    @Override
    public String getWebhookSecret() {
        return razorpayConfig.getWebhookSecret();
    }

    private String calculateHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
