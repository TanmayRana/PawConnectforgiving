package com.example.PawConnect.service;

import java.math.BigDecimal;
import java.util.Map;

public interface RazorpayService {

    String createOrder(BigDecimal amount, String currency, String receipt, Map<String, String> notes);

    String createOrder(long amountInPaise, String currency, String receipt, Map<String, String> notes);

    boolean verifyPaymentSignature(String orderId, String paymentId, String signature);

    boolean verifyWebhookSignature(String payload, String signature);

    String generatePaymentSignature(String orderId, String paymentId);

    String refundPayment(String paymentId, long amountInPaise, String reason);

    String fetchOrderStatus(String razorpayOrderId);

    com.razorpay.Payment fetchPayment(String paymentId);

    boolean capturePayment(String paymentId, long amountInPaise);

    String getKeyId();

    String getKeySecret();

    String getWebhookSecret();
}
