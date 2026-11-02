package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateAppointmentRequest;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.response.PageResponse;

public interface AppointmentService {

    AppointmentResponse createAppointment(CreateAppointmentRequest request);

    PageResponse<AppointmentResponse> getCustomerAppointments(AppointmentStatus status, int page, int size, String sort);

    AppointmentResponse getCustomerAppointment(Long appointmentId);

    AppointmentResponse cancelCustomerAppointment(Long appointmentId, CancelBookingRequest request);

    PageResponse<AppointmentResponse> getVeterinarianAppointments(AppointmentStatus status, int page, int size, String sort);

    AppointmentResponse getVeterinarianAppointment(Long appointmentId);

    AppointmentResponse updateVeterinarianAppointmentStatus(Long appointmentId, UpdateBookingStatusRequest request);
}
