package com.example.PawConnect.service;

import com.example.PawConnect.model.Address;
import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.ServiceBooking;

public interface AuthorizationService {

    boolean isCurrentUser(Long userId);

    void requireCurrentUser(Long userId);

    void requirePetOwner(Long petId);

    Pet getPetAndRequireOwner(Long petId);

    void requireAddressOwner(Long addressId);

    Address getAddressAndRequireOwner(Long addressId);

    void requireOrderOwner(Long orderId);

    void requireAppointmentAccess(Long appointmentId);

    Appointment getAppointmentAndRequireOwner(Long appointmentId);

    Appointment getAppointmentAndRequireVeterinarian(Long appointmentId);

    void requireServiceBookingAccess(Long bookingId);

    ServiceBooking getServiceBookingAndRequireOwner(Long bookingId);

    ServiceBooking getServiceBookingAndRequireProvider(Long bookingId);
}
