package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.BookingSummaryResponse;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.model.ServiceBooking;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

@Component
public class ServiceBookingMapper {

    public ServiceBookingResponse toResponse(ServiceBooking booking) {
        if (booking == null) {
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

        if (booking.getPet() != null) {
            petId = booking.getPet().getId();
            petName = booking.getPet().getName();
            species = booking.getPet().getSpecies();
            breed = booking.getPet().getBreed();
            petPhotoUrl = booking.getPet().getPhotoUrl();

            if (booking.getPet().getOwner() != null) {
                ownerId = booking.getPet().getOwner().getId();
                String first = booking.getPet().getOwner().getFirstName() != null ? booking.getPet().getOwner().getFirstName() : "";
                String last = booking.getPet().getOwner().getLastName() != null ? booking.getPet().getOwner().getLastName() : "";
                ownerName = (first + " " + last).trim();
                ownerPhone = booking.getPet().getOwner().getPhone();
            }
        }

        Long providerId = null;
        String businessName = null;
        String providerPhone = null;
        String providerType = null;

        if (booking.getProvider() != null) {
            providerId = booking.getProvider().getId();
            businessName = booking.getProvider().getBusinessName();
            providerPhone = booking.getProvider().getPhone();
            providerType = booking.getProvider().getProviderType() != null ? booking.getProvider().getProviderType().name() : null;
        }

        Long serviceId = null;
        String serviceName = null;
        Integer durationMinutes = null;

        if (booking.getService() != null) {
            serviceId = booking.getService().getId();
            serviceName = booking.getService().getName();
            durationMinutes = booking.getService().getDurationMinutes();
        }

        PaymentStatus paymentStatus = booking.getPayment() != null && booking.getPayment().getStatus() != null
                ? booking.getPayment().getStatus()
                : PaymentStatus.PENDING;

        java.time.Instant expiresAt = booking.getPaymentExpiresAt();
        Long remainingSeconds = null;
        boolean canRetry = false;
        if (expiresAt != null) {
            remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), expiresAt).getSeconds());
            canRetry = (paymentStatus == PaymentStatus.PENDING || paymentStatus == PaymentStatus.FAILED)
                    && booking.getStatus() == com.example.PawConnect.model.BookingStatus.PENDING
                    && java.time.Instant.now().isBefore(expiresAt);
        }

        return ServiceBookingResponse.builder()
                .id(booking.getId())
                .bookingNo(booking.getBookingNo())
                .petId(petId)
                .petName(petName)
                .species(species)
                .breed(breed)
                .petPhotoUrl(petPhotoUrl)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .ownerPhone(ownerPhone)
                .providerId(providerId)
                .businessName(businessName)
                .providerPhone(providerPhone)
                .providerType(providerType)
                .serviceId(serviceId)
                .serviceName(serviceName)
                .durationMinutes(durationMinutes)
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .price(booking.getPrice())
                .status(booking.getStatus())
                .paymentStatus(paymentStatus)
                .paymentExpiresAt(expiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    public BookingSummaryResponse toSummary(ServiceBooking booking) {
        if (booking == null) {
            return null;
        }

        Long petId = null;
        String petName = null;
        String species = null;
        String breed = null;
        String petPhotoUrl = null;

        if (booking.getPet() != null) {
            petId = booking.getPet().getId();
            petName = booking.getPet().getName();
            species = booking.getPet().getSpecies();
            breed = booking.getPet().getBreed();
            petPhotoUrl = booking.getPet().getPhotoUrl();
        }

        Long providerId = null;
        String businessName = null;
        String providerPhone = null;
        String providerType = null;
        String providerImageUrl = null;
        String providerAddress = null;
        BigDecimal providerLatitude = null;
        BigDecimal providerLongitude = null;

        if (booking.getProvider() != null) {
            providerId = booking.getProvider().getId();
            businessName = booking.getProvider().getBusinessName();
            providerAddress = booking.getProvider().getAddress();
            providerLatitude = booking.getProvider().getLatitude();
            providerLongitude = booking.getProvider().getLongitude();
            providerPhone = booking.getProvider().getPhone();
            providerType = booking.getProvider().getProviderType() != null ? booking.getProvider().getProviderType().name() : null;
            if (booking.getProvider().getUser() != null) {
                providerImageUrl = booking.getProvider().getUser().getProfileImage();
            }
        }

        Long serviceId = null;
        String serviceName = null;

        if (booking.getService() != null) {
            serviceId = booking.getService().getId();
            serviceName = booking.getService().getName();
        }

        com.example.PawConnect.model.PaymentStatus pStatus = booking.getPayment() != null && booking.getPayment().getStatus() != null
                ? booking.getPayment().getStatus()
                : PaymentStatus.PENDING;
        String paymentStatusStr = pStatus.name();

        java.time.Instant expiresAt = booking.getPaymentExpiresAt();
        Long remainingSeconds = null;
        boolean canRetry = false;
        if (expiresAt != null) {
            remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), expiresAt).getSeconds());
            canRetry = (pStatus == PaymentStatus.PENDING || pStatus == PaymentStatus.FAILED)
                    && booking.getStatus() == com.example.PawConnect.model.BookingStatus.PENDING
                    && java.time.Instant.now().isBefore(expiresAt);
        }

        return BookingSummaryResponse.builder()
                .id(booking.getId())
                .bookingType("SERVICE")
                .referenceNo(booking.getBookingNo())
                .petId(petId)
                .petName(petName)
                .species(species)
                .breed(breed)
                .petPhotoUrl(petPhotoUrl)
                .providerId(providerId)
                .providerName(businessName)
                .providerType(providerType)
                .providerPhone(providerPhone)
                .providerImageUrl(providerImageUrl)
                .clinicOrBusinessName(businessName)
                .locationAddress(providerAddress)
                .latitude(providerLatitude)
                .longitude(providerLongitude)
                .serviceId(serviceId)
                .serviceOrReason(serviceName)
                .date(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .amount(booking.getPrice())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .paymentStatus(paymentStatusStr)
                .paymentExpiresAt(expiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
