package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateBookingRequest;
import com.example.PawConnect.dto.response.BookingSummaryResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.UnifiedBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/bookings")
@RequiredArgsConstructor
@Tag(name = "Customer Bookings", description = "Unified customer booking management for veterinary and service appointments")
@PreAuthorize("hasRole('PET_OWNER')")
public class CustomerBookingController {

    private final UnifiedBookingService unifiedBookingService;

    @PostMapping
    @Operation(summary = "Create a new booking (Veterinary appointment or Service booking)")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request
    ) {
        BookingSummaryResponse response = unifiedBookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Booking created successfully"));
    }

    @GetMapping
    @Operation(summary = "List current customer's bookings with pagination and optional type filter")
    public ResponseEntity<ApiResponse<PageResponse<BookingSummaryResponse>>> getBookings(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort
    ) {
        PageResponse<BookingSummaryResponse> response = unifiedBookingService.getCustomerBookings(type, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Bookings retrieved successfully"));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Retrieve a booking by ID")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingById(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String type
    ) {
        BookingSummaryResponse response = unifiedBookingService.getCustomerBooking(bookingId, type);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking retrieved successfully"));
    }

    @PatchMapping("/{bookingId}/cancel")
    @Operation(summary = "Cancel an active booking by ID")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String type,
            @RequestBody(required = false) CancelBookingRequest request
    ) {
        BookingSummaryResponse response = unifiedBookingService.cancelCustomerBooking(bookingId, type, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking cancelled successfully"));
    }
}
