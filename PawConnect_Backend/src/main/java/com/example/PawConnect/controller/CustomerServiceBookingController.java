package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateServiceBookingRequest;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.ServiceBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/service-bookings")
@RequiredArgsConstructor
@Tag(name = "Customer Service Bookings", description = "Customer service provider booking management")
@PreAuthorize("hasRole('PET_OWNER')")
public class CustomerServiceBookingController {

    private final ServiceBookingService serviceBookingService;

    @PostMapping
    @Operation(summary = "Book a new service provider appointment")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> createServiceBooking(
            @Valid @RequestBody CreateServiceBookingRequest request
    ) {
        ServiceBookingResponse response = serviceBookingService.createServiceBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Service booking created successfully"));
    }

    @GetMapping
    @Operation(summary = "List current customer's service bookings with pagination and optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<ServiceBookingResponse>>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "bookingDate,desc") String sort
    ) {
        PageResponse<ServiceBookingResponse> response = serviceBookingService.getCustomerServiceBookings(status, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Service bookings retrieved successfully"));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Retrieve service booking details by ID")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> getBookingById(
            @PathVariable Long bookingId
    ) {
        ServiceBookingResponse response = serviceBookingService.getCustomerServiceBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Service booking retrieved successfully"));
    }

    @PatchMapping("/{bookingId}/cancel")
    @Operation(summary = "Cancel an active service booking")
    public ResponseEntity<ApiResponse<ServiceBookingResponse>> cancelBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) CancelBookingRequest request
    ) {
        ServiceBookingResponse response = serviceBookingService.cancelCustomerServiceBooking(bookingId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Service booking cancelled successfully"));
    }
}
