package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vet/appointments")
@RequiredArgsConstructor
@Tag(name = "Veterinarian Appointments", description = "Veterinarian appointment management and lifecycle transitions")
@PreAuthorize("hasRole('VETERINARIAN')")
public class VeterinarianAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    @Operation(summary = "List appointments assigned to current veterinarian with pagination and optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appointmentDate,desc") String sort
    ) {
        PageResponse<AppointmentResponse> response = appointmentService.getVeterinarianAppointments(status, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointments retrieved successfully"));
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "Retrieve appointment details for an assigned appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long appointmentId
    ) {
        AppointmentResponse response = appointmentService.getVeterinarianAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointment retrieved successfully"));
    }

    @PatchMapping("/{appointmentId}/status")
    @Operation(summary = "Update appointment status (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        AppointmentResponse response = appointmentService.updateVeterinarianAppointmentStatus(appointmentId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointment status updated successfully"));
    }
}
