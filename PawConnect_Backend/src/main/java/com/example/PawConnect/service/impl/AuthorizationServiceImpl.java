package com.example.PawConnect.service.impl;

import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("authorizationService")
@RequiredArgsConstructor
public class AuthorizationServiceImpl implements AuthorizationService {

    private final CurrentUserService currentUserService;
    private final PetRepository petRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;

    @Override
    public boolean isCurrentUser(Long userId) {
        return currentUserService.isCurrentUser(userId);
    }

    @Override
    public void requireCurrentUser(Long userId) {
        currentUserService.requireCurrentUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public void requirePetOwner(Long petId) {
        getPetAndRequireOwner(petId);
    }

    @Override
    @Transactional(readOnly = true)
    public Pet getPetAndRequireOwner(Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + petId));

        if (currentUserService.hasRole("ADMIN")) {
            return pet;
        }

        Long ownerId = pet.getOwner() != null ? pet.getOwner().getId() : null;
        if (!currentUserService.isCurrentUser(ownerId)) {
            throw new ForbiddenException("Access denied: you do not own this pet record");
        }
        return pet;
    }

    @Override
    @Transactional(readOnly = true)
    public void requireAddressOwner(Long addressId) {
        getAddressAndRequireOwner(addressId);
    }

    @Override
    @Transactional(readOnly = true)
    public Address getAddressAndRequireOwner(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        if (currentUserService.hasRole("ADMIN")) {
            return address;
        }

        Long ownerId = address.getUser() != null ? address.getUser().getId() : null;
        if (!currentUserService.isCurrentUser(ownerId)) {
            throw new ForbiddenException("Access denied: you do not own this address record");
        }
        return address;
    }

    @Override
    @Transactional(readOnly = true)
    public void requireOrderOwner(Long orderId) {
        if (currentUserService.hasRole("ADMIN")) {
            return;
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Long ownerId = order.getUser() != null ? order.getUser().getId() : null;
        if (!currentUserService.isCurrentUser(ownerId)) {
            throw new ForbiddenException("Access denied: you do not own this order record");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void requireAppointmentAccess(Long appointmentId) {
        if (currentUserService.hasRole("ADMIN")) {
            return;
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isPetOwner = appointment.getPet() != null 
                && appointment.getPet().getOwner() != null 
                && currentUserId.equals(appointment.getPet().getOwner().getId());
        
        boolean isVeterinarian = appointment.getVeterinarian() != null 
                && appointment.getVeterinarian().getUser() != null 
                && currentUserId.equals(appointment.getVeterinarian().getUser().getId());

        if (!isPetOwner && !isVeterinarian) {
            throw new ForbiddenException("Access denied: you do not have permission to access this appointment");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void requireServiceBookingAccess(Long bookingId) {
        if (currentUserService.hasRole("ADMIN")) {
            return;
        }
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isCustomer = booking.getPet() != null 
                && booking.getPet().getOwner() != null 
                && currentUserId.equals(booking.getPet().getOwner().getId());
        
        boolean isProvider = booking.getProvider() != null 
                && booking.getProvider().getUser() != null 
                && currentUserId.equals(booking.getProvider().getUser().getId());

        if (!isCustomer && !isProvider) {
            throw new ForbiddenException("Access denied: you do not have permission to access this service booking");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Appointment getAppointmentAndRequireOwner(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isOwner = appointment.getPet() != null 
                && appointment.getPet().getOwner() != null 
                && currentUserId.equals(appointment.getPet().getOwner().getId());

        if (!isOwner) {
            throw new ForbiddenException("Access denied: you do not own this appointment");
        }
        return appointment;
    }

    @Override
    @Transactional(readOnly = true)
    public Appointment getAppointmentAndRequireVeterinarian(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isVet = appointment.getVeterinarian() != null 
                && appointment.getVeterinarian().getUser() != null 
                && currentUserId.equals(appointment.getVeterinarian().getUser().getId());

        if (!isVet) {
            throw new ForbiddenException("Access denied: you are not the assigned veterinarian for this appointment");
        }
        return appointment;
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceBooking getServiceBookingAndRequireOwner(Long bookingId) {
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isOwner = booking.getPet() != null 
                && booking.getPet().getOwner() != null 
                && currentUserId.equals(booking.getPet().getOwner().getId());

        if (!isOwner) {
            throw new ForbiddenException("Access denied: you do not own this service booking");
        }
        return booking;
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceBooking getServiceBookingAndRequireProvider(Long bookingId) {
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isProvider = booking.getProvider() != null 
                && booking.getProvider().getUser() != null 
                && currentUserId.equals(booking.getProvider().getUser().getId());

        if (!isProvider) {
            throw new ForbiddenException("Access denied: you are not the assigned service provider for this booking");
        }
        return booking;
    }
}

