package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateAppointmentRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/appointments")
@RequiredArgsConstructor
@Tag(name = "Customer Appointments", description = "Customer veterinary appointment management")
@PreAuthorize("hasRole('PET_OWNER')")
public class CustomerAppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Book a new veterinary appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request
    ) {
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Appointment booked successfully"));
    }

    @GetMapping
    @Operation(summary = "List current customer's appointments with pagination and optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appointmentDate,desc") String sort
    ) {
        PageResponse<AppointmentResponse> response = appointmentService.getCustomerAppointments(status, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointments retrieved successfully"));
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "Retrieve veterinary appointment details by ID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long appointmentId
    ) {
        AppointmentResponse response = appointmentService.getCustomerAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointment retrieved successfully"));
    }

    @PatchMapping("/{appointmentId}/cancel")
    @Operation(summary = "Cancel an active veterinary appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long appointmentId,
            @RequestBody(required = false) CancelBookingRequest request
    ) {
        AppointmentResponse response = appointmentService.cancelCustomerAppointment(appointmentId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointment cancelled successfully"));
    }
}
