package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateBookingRequest;
import com.example.PawConnect.dto.response.BookingSummaryResponse;
import com.example.PawConnect.response.PageResponse;

public interface UnifiedBookingService {

    BookingSummaryResponse createBooking(CreateBookingRequest request);

    PageResponse<BookingSummaryResponse> getCustomerBookings(String bookingType, int page, int size, String sort);

    BookingSummaryResponse getCustomerBooking(Long bookingId, String bookingType);

    BookingSummaryResponse cancelCustomerBooking(Long bookingId, String bookingType, CancelBookingRequest request);
}
