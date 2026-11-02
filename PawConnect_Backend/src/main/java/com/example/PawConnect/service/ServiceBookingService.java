package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateServiceBookingRequest;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.response.PageResponse;

public interface ServiceBookingService {

    ServiceBookingResponse createServiceBooking(CreateServiceBookingRequest request);

    PageResponse<ServiceBookingResponse> getCustomerServiceBookings(BookingStatus status, int page, int size, String sort);

    ServiceBookingResponse getCustomerServiceBooking(Long bookingId);

    ServiceBookingResponse cancelCustomerServiceBooking(Long bookingId, CancelBookingRequest request);

    PageResponse<ServiceBookingResponse> getProviderBookings(BookingStatus status, int page, int size, String sort);

    ServiceBookingResponse getProviderBooking(Long bookingId);

    ServiceBookingResponse updateProviderBookingStatus(Long bookingId, UpdateBookingStatusRequest request);
}
