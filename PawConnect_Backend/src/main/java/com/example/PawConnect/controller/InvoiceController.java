package com.example.PawConnect.controller;

import com.example.PawConnect.dto.response.InvoiceResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping({"/api/invoices/order/{orderId}", "/invoices/order/{orderId}"})
    public ResponseEntity<ApiResponse<InvoiceResponse>> getOrderInvoice(@PathVariable Long orderId) {
        InvoiceResponse invoice = invoiceService.getOrderInvoice(orderId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping({"/api/invoices/appointment/{appointmentId}", "/invoices/appointment/{appointmentId}"})
    public ResponseEntity<ApiResponse<InvoiceResponse>> getAppointmentInvoice(@PathVariable Long appointmentId) {
        InvoiceResponse invoice = invoiceService.getAppointmentInvoice(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping({"/api/invoices/service-booking/{bookingId}", "/invoices/service-booking/{bookingId}"})
    public ResponseEntity<ApiResponse<InvoiceResponse>> getServiceBookingInvoice(@PathVariable Long bookingId) {
        InvoiceResponse invoice = invoiceService.getServiceBookingInvoice(bookingId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping({"/api/invoices/payment/{identifier}", "/invoices/payment/{identifier}"})
    public ResponseEntity<ApiResponse<InvoiceResponse>> getPaymentInvoice(@PathVariable String identifier) {
        InvoiceResponse invoice = invoiceService.getPaymentInvoice(identifier);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }
}
