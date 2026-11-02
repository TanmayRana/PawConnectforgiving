package com.example.PawConnect.service;

import com.example.PawConnect.dto.response.InvoiceResponse;

public interface InvoiceService {
    InvoiceResponse getOrderInvoice(Long orderId);
    InvoiceResponse getAppointmentInvoice(Long appointmentId);
    InvoiceResponse getServiceBookingInvoice(Long bookingId);
    InvoiceResponse getPaymentInvoice(String identifier);
}
