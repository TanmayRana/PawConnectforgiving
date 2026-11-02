package com.example.PawConnect.service;

/**
 * Service for generating modern, responsive HTML transactional emails
 * that reflect PawConnect's brand identity and UI design system.
 */
public interface EmailTemplateService {

    /**
     * Builds an HTML email for verification OTPs (Registration, Password Reset, Veterinarian / Provider onboarding).
     *
     * @param recipientName optional recipient name or greeting (null for generic greeting)
     * @param otpCode 6-digit verification code
     * @param purposeBadge short category badge (e.g. "Account Verification", "Password Reset")
     * @param message main instructional description
     * @param expiryMinutes minutes before code expires
     * @return fully formatted responsive HTML email
     */
    String buildOtpEmail(String recipientName, String otpCode, String purposeBadge, String message, int expiryMinutes);

    /**
     * Builds an HTML email for administrative user provisioning with a generated temporary password.
     *
     * @param email recipient user email
     * @param temporaryPassword generated raw password
     * @param expiryMinutes minutes before the temporary password expires
     * @return fully formatted responsive HTML email
     */
    String buildTemporaryPasswordEmail(String email, String temporaryPassword, int expiryMinutes);

    /**
     * Builds an HTML email for general system notifications (appointments, orders, bookings, alerts).
     *
     * @param recipientName recipient display name
     * @param title notification title
     * @param message notification body
     * @param actionUrl optional action button link
     * @param actionLabel optional action button text
     * @return fully formatted responsive HTML email
     */
    String buildNotificationEmail(String recipientName, String title, String message, String actionUrl, String actionLabel);

    /**
     * Builds an HTML email for order payment confirmation containing a structured GST Tax Invoice & Receipt summary box.
     */
    String buildOrderInvoiceEmail(String recipientName, String orderNo, String invoiceNo, String paymentId,
                                  String paymentMethod, java.math.BigDecimal subtotal, java.math.BigDecimal taxAmount,
                                  java.math.BigDecimal grandTotal, String actionUrl);

    /**
     * Builds an HTML email for order logistics update (packed, shipped, delivered) with tracking and POD details.
     */
    String buildOrderTrackingEmail(String recipientName, String orderNo, String orderStatus, String shippingLabelNo,
                                   String courierPartner, String awbTrackingNo, String estimatedDeliveryDate,
                                   String podNotes, String actionUrl);
}
