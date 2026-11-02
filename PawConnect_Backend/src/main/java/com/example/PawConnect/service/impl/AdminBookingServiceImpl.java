package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.AppointmentMapper;
import com.example.PawConnect.mapper.ServiceBookingMapper;
import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.ServiceBooking;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.AppointmentRepository;
import com.example.PawConnect.repository.ServiceBookingRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminBookingService;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.NotificationService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBookingServiceImpl implements AdminBookingService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final AppointmentMapper appointmentMapper;
    private final ServiceBookingMapper serviceBookingMapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    private static final Set<String> ALLOWED_APPOINTMENT_SORT_FIELDS = Set.of(
            "id", "appointmentDate", "createdAt", "status", "consultationFee"
    );

    private static final Set<String> ALLOWED_SERVICE_BOOKING_SORT_FIELDS = Set.of(
            "id", "bookingDate", "createdAt", "status", "price"
    );

    private static final int MAX_PAGE_SIZE = 100;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getAppointments(
            AppointmentStatus status,
            Long veterinarianId,
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_APPOINTMENT_SORT_FIELDS, "appointmentDate");

        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (veterinarianId != null) {
                predicates.add(cb.equal(root.get("veterinarian").get("id"), veterinarianId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("pet").get("owner").get("id"), userId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("appointmentDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("appointmentDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Appointment> page = appointmentRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(appointmentMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
        return appointmentMapper.toResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long appointmentId, UpdateBookingStatusRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        String rawStatus = request.getStatus().trim().toUpperCase().replace("-", "_");
        if ("UPCOMING".equals(rawStatus)) {
            rawStatus = "PENDING";
        }

        AppointmentStatus targetStatus;
        try {
            targetStatus = AppointmentStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid appointment status: " + request.getStatus());
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(targetStatus);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            appointment.setNotes(request.getNotes().trim());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Admin updated appointment {} status from {} to {}", updated.getAppointmentNo(), oldStatus, targetStatus);

        User petOwner = (updated.getPet() != null) ? updated.getPet().getOwner() : null;
        if (petOwner != null) {
            NotificationType notifType = switch (targetStatus) {
                case CONFIRMED -> NotificationType.BOOKING_CONFIRMED;
                case CANCELLED -> NotificationType.BOOKING_CANCELLED;
                default -> NotificationType.BOOKING_CONFIRMED;
            };
            String dedupeKey = "NOTIF-APT-" + updated.getId() + "-" + targetStatus.name() + "-" + System.currentTimeMillis();
            try {
                notificationService.createNotification(
                        petOwner,
                        notifType,
                        "Appointment " + targetStatus.name(),
                        String.format("Your appointment %s with Dr. %s has been updated to %s.",
                                updated.getAppointmentNo(),
                                (updated.getVeterinarian() != null && updated.getVeterinarian().getUser() != null)
                                        ? updated.getVeterinarian().getUser().getFirstName() + " " + updated.getVeterinarian().getUser().getLastName()
                                        : "Veterinarian",
                                targetStatus.name().toLowerCase()),
                        "APPOINTMENT",
                        updated.getId(),
                        dedupeKey
                );
            } catch (Exception ex) {
                log.warn("Failed to create appointment status notification: {}", ex.getMessage());
            }
        }

        try {
            auditLogService.logAction(
                    "ADMIN_APPOINTMENT_STATUS_UPDATED",
                    "BOOKINGS",
                    "APPOINTMENT",
                    appointmentId,
                    "{\"status\":\"" + oldStatus + "\"}",
                    "{\"status\":\"" + targetStatus + "\"}"
            );
        } catch (Exception ex) {
            log.warn("Failed to log admin appointment status update audit: {}", ex.getMessage());
        }

        return appointmentMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceBookingResponse> getServiceBookings(
            BookingStatus status,
            Long providerId,
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_SERVICE_BOOKING_SORT_FIELDS, "bookingDate");

        Specification<ServiceBooking> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (providerId != null) {
                predicates.add(cb.equal(root.get("provider").get("id"), providerId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("pet").get("owner").get("id"), userId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bookingDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("bookingDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceBooking> page = serviceBookingRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(serviceBookingMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceBookingResponse getServiceBookingById(Long bookingId) {
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));
        return serviceBookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public ServiceBookingResponse updateServiceBookingStatus(Long bookingId, UpdateBookingStatusRequest request) {
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));

        String rawStatus = request.getStatus().trim().toUpperCase().replace("-", "_");
        if ("UPCOMING".equals(rawStatus)) {
            rawStatus = "PENDING";
        }

        BookingStatus targetStatus;
        try {
            targetStatus = BookingStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid booking status: " + request.getStatus());
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(targetStatus);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            booking.setNotes(request.getNotes().trim());
        }

        ServiceBooking updated = serviceBookingRepository.save(booking);
        log.info("Admin updated service booking {} status from {} to {}", updated.getBookingNo(), oldStatus, targetStatus);

        User petOwner = (updated.getPet() != null) ? updated.getPet().getOwner() : null;
        if (petOwner != null) {
            NotificationType notifType = switch (targetStatus) {
                case CONFIRMED -> NotificationType.BOOKING_CONFIRMED;
                case CANCELLED -> NotificationType.BOOKING_CANCELLED;
                default -> NotificationType.BOOKING_CONFIRMED;
            };
            String dedupeKey = "NOTIF-SB-" + updated.getId() + "-" + targetStatus.name() + "-" + System.currentTimeMillis();
            try {
                notificationService.createNotification(
                        petOwner,
                        notifType,
                        "Service Booking " + targetStatus.name(),
                        String.format("Your service booking %s has been updated to %s.",
                                updated.getBookingNo(),
                                targetStatus.name().toLowerCase()),
                        "SERVICE_BOOKING",
                        updated.getId(),
                        dedupeKey
                );
            } catch (Exception ex) {
                log.warn("Failed to create service booking status notification: {}", ex.getMessage());
            }
        }

        try {
            auditLogService.logAction(
                    "ADMIN_SERVICE_BOOKING_STATUS_UPDATED",
                    "BOOKINGS",
                    "SERVICE_BOOKING",
                    bookingId,
                    "{\"status\":\"" + oldStatus + "\"}",
                    "{\"status\":\"" + targetStatus + "\"}"
            );
        } catch (Exception ex) {
            log.warn("Failed to log admin service booking status update audit: {}", ex.getMessage());
        }

        return serviceBookingMapper.toResponse(updated);
    }

    private Pageable sanitizePageable(Pageable pageable, Set<String> allowedSorts, String defaultSort) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!allowedSorts.contains(order.getProperty())) {
                throw new IllegalArgumentException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), allowedSorts
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, defaultSort)
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
