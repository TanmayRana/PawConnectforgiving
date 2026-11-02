package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    // Appointments
    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) Long veterinarianId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<AppointmentResponse> appointments = adminBookingService.getAppointments(
                status, veterinarianId, userId, startDate, endDate, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @GetMapping("/appointments/{appointmentId}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long appointmentId
    ) {
        AppointmentResponse appointment = adminBookingService.getAppointmentById(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(appointment));
    }

    @PatchMapping("/appointments/{appointmentId}/status")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        AppointmentResponse appointment = adminBookingService.updateAppointmentStatus(appointmentId, request);
        return ResponseEntity.ok(ApiResponse.ok(appointment, "Appointment status updated successfully"));
    }

    // Service Bookings
    @GetMapping("/service-bookings")
    public ResponseEntity<ApiResponse<PageResponse<ServiceBookingResponse>>> getServiceBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ServiceBookingResponse> bookings = adminBookingService.getServiceBookings(
                status, providerId, userId, startDate, endDate, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @GetMapping("/service-bookings/{bookingId}")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> getServiceBookingById(
            @PathVariable Long bookingId
    ) {
        ServiceBookingResponse booking = adminBookingService.getServiceBookingById(bookingId);
        return ResponseEntity.ok(ApiResponse.success(booking));
    }

    @PatchMapping("/service-bookings/{bookingId}/status")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> updateServiceBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        ServiceBookingResponse booking = adminBookingService.updateServiceBookingStatus(bookingId, request);
        return ResponseEntity.ok(ApiResponse.ok(booking, "Service booking status updated successfully"));
    }
}
