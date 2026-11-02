package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
    private String invoiceNumber;
    private LocalDateTime invoiceDate;
    private String invoiceType; // "ORDER", "APPOINTMENT", "SERVICE_BOOKING", "PAYMENT"
    private Long resourceId;
    private String referenceNumber;

    // Issuer Details
    private String issuerName;
    private String issuerSubHeader;
    private String issuerAddress;
    private String issuerGstin;
    private String issuerPhone;
    private String issuerEmail;

    // Billed To Customer
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String billingAddress;

    // Shipped To (Orders) or Patient Details (Vet/Booking)
    private String shippingAddress;
    private String courierPartner;
    private String awbNumber;
    private String petName;
    private String petSpecies;
    private String petBreed;
    private String scheduledDate;
    private String scheduledTimeSlot;

    // Payment Gateway Details
    private String paymentStatus;
    private String paymentMethod;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;

    // Tax & Totals Breakdown
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal taxableAmount;
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal totalAmount;
    private BigDecimal grandTotal;
    private String hsnSacCode;
    private String amountInWords;

    public BigDecimal getGrandTotal() {
        return grandTotal != null ? grandTotal : totalAmount;
    }

    private List<InvoiceLineItem> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceLineItem {
        private Integer serialNo;
        private String description;
        private String hsnSacCode;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal taxableValue;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal lineTotal;
    }
}
