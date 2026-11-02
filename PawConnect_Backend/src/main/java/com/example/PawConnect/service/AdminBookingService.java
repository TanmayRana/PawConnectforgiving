package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AdminBookingService {

    PageResponse<AppointmentResponse> getAppointments(
            AppointmentStatus status,
            Long veterinarianId,
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    AppointmentResponse getAppointmentById(Long appointmentId);

    AppointmentResponse updateAppointmentStatus(Long appointmentId, UpdateBookingStatusRequest request);

    PageResponse<ServiceBookingResponse> getServiceBookings(
            BookingStatus status,
            Long providerId,
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    ServiceBookingResponse getServiceBookingById(Long bookingId);

    ServiceBookingResponse updateServiceBookingStatus(Long bookingId, UpdateBookingStatusRequest request);
}
