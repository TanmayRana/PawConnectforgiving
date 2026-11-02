package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.dto.response.BookingSummaryResponse;
import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.PaymentStatus;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    public AppointmentResponse toResponse(Appointment appointment) {
        if (appointment == null) {
            return null;
        }

        Long petId = null;
        String petName = null;
        String species = null;
        String breed = null;
        String petPhotoUrl = null;
        Long ownerId = null;
        String ownerName = null;
        String ownerPhone = null;

        if (appointment.getPet() != null) {
            petId = appointment.getPet().getId();
            petName = appointment.getPet().getName();
            species = appointment.getPet().getSpecies();
            breed = appointment.getPet().getBreed();
            petPhotoUrl = appointment.getPet().getPhotoUrl();

            if (appointment.getPet().getOwner() != null) {
                ownerId = appointment.getPet().getOwner().getId();
                String first = appointment.getPet().getOwner().getFirstName() != null ? appointment.getPet().getOwner().getFirstName() : "";
                String last = appointment.getPet().getOwner().getLastName() != null ? appointment.getPet().getOwner().getLastName() : "";
                ownerName = (first + " " + last).trim();
                ownerPhone = appointment.getPet().getOwner().getPhone();
            }
        }

        Long vetId = null;
        String vetName = null;
        String clinicName = null;
        String specialization = null;

        if (appointment.getVeterinarian() != null) {
            vetId = appointment.getVeterinarian().getId();
            clinicName = appointment.getVeterinarian().getClinicName();
            specialization = appointment.getVeterinarian().getSpecialization();

            if (appointment.getVeterinarian().getUser() != null) {
                String first = appointment.getVeterinarian().getUser().getFirstName() != null ? appointment.getVeterinarian().getUser().getFirstName() : "";
                String last = appointment.getVeterinarian().getUser().getLastName() != null ? appointment.getVeterinarian().getUser().getLastName() : "";
                vetName = (first + " " + last).trim();
            }
        }

        PaymentStatus paymentStatus = appointment.getPayment() != null && appointment.getPayment().getStatus() != null
                ? appointment.getPayment().getStatus()
                : PaymentStatus.PENDING;

        java.time.Instant expiresAt = appointment.getPaymentExpiresAt();
        Long remainingSeconds = null;
        boolean canRetry = false;
        if (expiresAt != null) {
            remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), expiresAt).getSeconds());
            canRetry = (paymentStatus == PaymentStatus.PENDING || paymentStatus == PaymentStatus.FAILED)
                    && appointment.getStatus() == com.example.PawConnect.model.AppointmentStatus.PENDING
                    && java.time.Instant.now().isBefore(expiresAt);
        }

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .appointmentNo(appointment.getAppointmentNo())
                .petId(petId)
                .petName(petName)
                .species(species)
                .breed(breed)
                .petPhotoUrl(petPhotoUrl)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .ownerPhone(ownerPhone)
                .veterinarianId(vetId)
                .veterinarianName(vetName)
                .clinicName(clinicName)
                .specialization(specialization)
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .reason(appointment.getReason())
                .consultationFee(appointment.getConsultationFee())
                .status(appointment.getStatus())
                .paymentStatus(paymentStatus)
                .paymentExpiresAt(expiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    public BookingSummaryResponse toSummary(Appointment appointment) {
        if (appointment == null) {
            return null;
        }

        Long petId = null;
        String petName = null;
        String species = null;
        String breed = null;
        String petPhotoUrl = null;

        if (appointment.getPet() != null) {
            petId = appointment.getPet().getId();
            petName = appointment.getPet().getName();
            species = appointment.getPet().getSpecies();
            breed = appointment.getPet().getBreed();
            petPhotoUrl = appointment.getPet().getPhotoUrl();
        }

        Long vetId = null;
        String vetName = null;
        String vetPhone = null;
        String providerImageUrl = null;
        String clinicName = null;
        String clinicAddress = null;
        BigDecimal clinicLatitude = null;
        BigDecimal clinicLongitude = null;

        if (appointment.getVeterinarian() != null) {
            vetId = appointment.getVeterinarian().getId();
            clinicName = appointment.getVeterinarian().getClinicName();
            clinicAddress = appointment.getVeterinarian().getClinicAddress();
            clinicLatitude = appointment.getVeterinarian().getClinicLatitude();
            clinicLongitude = appointment.getVeterinarian().getClinicLongitude();
            if (appointment.getVeterinarian().getUser() != null) {
                String first = appointment.getVeterinarian().getUser().getFirstName() != null ? appointment.getVeterinarian().getUser().getFirstName() : "";
                String last = appointment.getVeterinarian().getUser().getLastName() != null ? appointment.getVeterinarian().getUser().getLastName() : "";
                vetName = (first + " " + last).trim();
                vetPhone = appointment.getVeterinarian().getUser().getPhone();
                providerImageUrl = appointment.getVeterinarian().getUser().getProfileImage();
            }
        }

        com.example.PawConnect.model.PaymentStatus pStatus = appointment.getPayment() != null && appointment.getPayment().getStatus() != null
                ? appointment.getPayment().getStatus()
                : PaymentStatus.PENDING;
        String paymentStatusStr = pStatus.name();

        java.time.Instant expiresAt = appointment.getPaymentExpiresAt();
        Long remainingSeconds = null;
        boolean canRetry = false;
        if (expiresAt != null) {
            remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), expiresAt).getSeconds());
            canRetry = (pStatus == PaymentStatus.PENDING || pStatus == PaymentStatus.FAILED)
                    && appointment.getStatus() == com.example.PawConnect.model.AppointmentStatus.PENDING
                    && java.time.Instant.now().isBefore(expiresAt);
        }

        return BookingSummaryResponse.builder()
                .id(appointment.getId())
                .bookingType("VETERINARY")
                .referenceNo(appointment.getAppointmentNo())
                .petId(petId)
                .petName(petName)
                .species(species)
                .breed(breed)
                .petPhotoUrl(petPhotoUrl)
                .providerId(vetId)
                .providerName(vetName)
                .providerType("VETERINARIAN")
                .providerPhone(vetPhone)
                .providerImageUrl(providerImageUrl)
                .clinicOrBusinessName(clinicName)
                .locationAddress(clinicAddress)
                .latitude(clinicLatitude)
                .longitude(clinicLongitude)
                .serviceId(null)
                .serviceOrReason(appointment.getReason())
                .date(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .amount(appointment.getConsultationFee())
                .status(appointment.getStatus() != null ? appointment.getStatus().name() : null)
                .paymentStatus(paymentStatusStr)
                .paymentExpiresAt(expiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}
