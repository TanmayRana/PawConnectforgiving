package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.ServiceBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/provider/bookings")
@RequiredArgsConstructor
@Tag(name = "Service Provider Bookings", description = "Service provider booking management and lifecycle transitions")
@PreAuthorize("hasRole('SERVICE_PROVIDER')")
public class ProviderBookingController {

    private final ServiceBookingService serviceBookingService;

    @GetMapping
    @Operation(summary = "List bookings assigned to current service provider with pagination and optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<ServiceBookingResponse>>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "bookingDate,desc") String sort
    ) {
        PageResponse<ServiceBookingResponse> response = serviceBookingService.getProviderBookings(status, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Bookings retrieved successfully"));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Retrieve booking details for an assigned service booking")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> getBookingById(
            @PathVariable Long bookingId
    ) {
        ServiceBookingResponse response = serviceBookingService.getProviderBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking retrieved successfully"));
    }

    @PatchMapping("/{bookingId}/status")
    @Operation(summary = "Update service booking status (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> updateBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        ServiceBookingResponse response = serviceBookingService.updateProviderBookingStatus(bookingId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking status updated successfully"));
    }
}
