package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateAppointmentRequest;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.InvalidStateTransitionException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.exception.SlotConflictException;
import com.example.PawConnect.mapper.AppointmentMapper;
import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetStatus;
import com.example.PawConnect.model.Veterinarian;
import com.example.PawConnect.model.VeterinarianAvailability;
import com.example.PawConnect.model.VeterinarianVerificationStatus;
import com.example.PawConnect.repository.AppointmentRepository;
import com.example.PawConnect.repository.VeterinarianAvailabilityRepository;
import com.example.PawConnect.repository.VeterinarianRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AppointmentService;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.User;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.util.PaginationUtils;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.repository.PaymentOrderRepository;
import com.example.PawConnect.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class AppointmentServiceImpl implements AppointmentService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "appointmentNo", "appointmentDate", "startTime", "endTime", "status", "createdAt", "updatedAt"
    );

    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final AppointmentRepository appointmentRepository;
    private final VeterinarianRepository veterinarianRepository;
    private final VeterinarianAvailabilityRepository veterinarianAvailabilityRepository;
    private final AppointmentMapper appointmentMapper;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final PaymentOrderRepository paymentOrderRepository;

    public AppointmentServiceImpl(
            CurrentUserService currentUserService,
            AuthorizationService authorizationService,
            AppointmentRepository appointmentRepository,
            VeterinarianRepository veterinarianRepository,
            VeterinarianAvailabilityRepository veterinarianAvailabilityRepository,
            AppointmentMapper appointmentMapper,
            NotificationService notificationService,
            @Lazy PaymentService paymentService,
            PaymentOrderRepository paymentOrderRepository
    ) {
        this.currentUserService = currentUserService;
        this.authorizationService = authorizationService;
        this.appointmentRepository = appointmentRepository;
        this.veterinarianRepository = veterinarianRepository;
        this.veterinarianAvailabilityRepository = veterinarianAvailabilityRepository;
        this.appointmentMapper = appointmentMapper;
        this.notificationService = notificationService;
        this.paymentService = paymentService;
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @Override
    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(request.getPetId());
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new BusinessRuleException("Cannot book an appointment for an inactive pet profile");
        }

        LocalDate appointmentDate = request.getAppointmentDate();
        LocalTime startTime = request.getStartTime();
        validateNotPast(appointmentDate, startTime);

        // Pessimistic lock on the veterinarian record prevents concurrent double-booking
        Veterinarian vet = veterinarianRepository.findByIdForUpdate(request.getVeterinarianId())
                .orElseThrow(() -> new ResourceNotFoundException("Veterinarian not found with id: " + request.getVeterinarianId()));

        if (!Boolean.TRUE.equals(vet.getIsActive())) {
            throw new BusinessRuleException("Selected veterinarian is currently not active");
        }

        if (vet.getVerificationStatus() != VeterinarianVerificationStatus.APPROVED) {
            throw new BusinessRuleException("Selected veterinarian is not verified for client bookings");
        }

        Optional<VeterinarianAvailability> availOpt = veterinarianAvailabilityRepository
                .findByVeterinarianIdAndDayOfWeek(vet.getId(), appointmentDate.getDayOfWeek());

        LocalTime endTime = request.getEndTime();
        if (endTime == null) {
            int durationMinutes = availOpt.map(a -> a.getSlotDurationMinutes()).orElse(30);
            endTime = startTime.plusMinutes(durationMinutes);
        } else {
            if (!endTime.isAfter(startTime)) {
                throw new BusinessRuleException("Appointment end time must be after start time");
            }
        }

        if (availOpt.isPresent()) {
            VeterinarianAvailability availability = availOpt.get();
            if (!Boolean.TRUE.equals(availability.getIsAvailable())) {
                throw new BusinessRuleException("Veterinarian is not available on " + appointmentDate.getDayOfWeek());
            }
            if (startTime.isBefore(availability.getStartTime()) || endTime.isAfter(availability.getEndTime())) {
                throw new BusinessRuleException(String.format(
                        "Requested time (%s - %s) falls outside veterinarian working hours (%s - %s)",
                        startTime, endTime, availability.getStartTime(), availability.getEndTime()
                ));
            }
        }

        // Check for overlapping bookings
        List<Appointment> conflicts = appointmentRepository.findOverlappingAppointments(
                vet.getId(),
                appointmentDate,
                startTime,
                endTime
        );

        if (!conflicts.isEmpty()) {
            throw new SlotConflictException("The selected veterinarian already has a booking during the requested time slot");
        }

        String appointmentNo = generateAppointmentNo();

        Appointment appointment = Appointment.builder()
                .appointmentNo(appointmentNo)
                .pet(pet)
                .veterinarian(vet)
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime(endTime)
                .reason(request.getReason())
                .consultationFee(vet.getConsultationFee() != null ? vet.getConsultationFee() : BigDecimal.ZERO)
                .status(AppointmentStatus.PENDING)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Created appointment {} for pet {} with vet {}", saved.getAppointmentNo(), pet.getId(), vet.getId());

        if (vet.getUser() != null) {
            String dedupeKey = "NOTIF-APT-" + saved.getId() + "-CREATED";
            notificationService.createNotification(
                    vet.getUser(),
                    NotificationType.BOOKING_CREATED,
                    "New Appointment Request",
                    String.format("New appointment %s requested for %s on %s at %s.",
                            saved.getAppointmentNo(), pet.getName(), saved.getAppointmentDate(), saved.getStartTime()),
                    "APPOINTMENT",
                    saved.getId(),
                    dedupeKey
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getCustomerAppointments(AppointmentStatus status, int page, int size, String sort) {
        Long ownerId = currentUserService.getCurrentUserId();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "appointmentDate");

        Page<Appointment> appointmentPage = (status != null)
                ? appointmentRepository.findByPetOwnerIdAndStatus(ownerId, status, pageable)
                : appointmentRepository.findByPetOwnerId(ownerId, pageable);

        return PageResponse.from(appointmentPage.map(appointmentMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getCustomerAppointment(Long appointmentId) {
        Appointment appointment = authorizationService.getAppointmentAndRequireOwner(appointmentId);
        return appointmentMapper.toResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelCustomerAppointment(Long appointmentId, CancelBookingRequest request) {
        Appointment appointment = authorizationService.getAppointmentAndRequireOwner(appointmentId);

        if (isTerminalState(appointment.getStatus())) {
            throw new InvalidStateTransitionException("Cannot cancel an appointment that is already in terminal status: " + appointment.getStatus());
        }

        validateNotPast(appointment.getAppointmentDate(), appointment.getStartTime());

        appointment.setStatus(AppointmentStatus.CANCELLED);
        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            String note = "Cancelled by customer: " + request.getReason().trim();
            appointment.setNotes(appointment.getNotes() != null ? appointment.getNotes() + " | " + note : note);
        }

        // Trigger auto-refund if appointment payment was completed
        paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(appointment.getId(), "VETERINARY")
                .or(() -> paymentOrderRepository.findTopByBookingIdOrderByCreatedAtDesc(appointment.getId()))
                .ifPresent(po -> {
                    if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                        try {
                            paymentService.refundPayment(po.getRazorpayOrderId(), "Appointment cancelled by customer");
                        } catch (Exception e) {
                            log.error("Automatic refund failed for appointment {}: {}", appointment.getId(), e.getMessage());
                        }
                    }
                });
        if (appointment.getPayment() != null && (appointment.getPayment().getStatus() == PaymentStatus.PAID || appointment.getPayment().getStatus() == PaymentStatus.SUCCESS)) {
            appointment.getPayment().setStatus(PaymentStatus.REFUNDED);
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Customer cancelled appointment {}", updated.getAppointmentNo());

        if (updated.getVeterinarian() != null && updated.getVeterinarian().getUser() != null) {
            String dedupeKey = "NOTIF-APT-" + updated.getId() + "-CANCELLED";
            notificationService.createNotification(
                    updated.getVeterinarian().getUser(),
                    NotificationType.BOOKING_CANCELLED,
                    "Appointment Cancelled",
                    String.format("Appointment %s has been cancelled by the customer.", updated.getAppointmentNo()),
                    "APPOINTMENT",
                    updated.getId(),
                    dedupeKey
            );
        }

        return appointmentMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getVeterinarianAppointments(AppointmentStatus status, int page, int size, String sort) {
        Veterinarian vet = getAuthenticatedVeterinarian();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "appointmentDate");

        Page<Appointment> appointmentPage = (status != null)
                ? appointmentRepository.findByVeterinarianIdAndStatus(vet.getId(), status, pageable)
                : appointmentRepository.findByVeterinarianId(vet.getId(), pageable);

        return PageResponse.from(appointmentPage.map(appointmentMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getVeterinarianAppointment(Long appointmentId) {
        Appointment appointment = authorizationService.getAppointmentAndRequireVeterinarian(appointmentId);
        return appointmentMapper.toResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse updateVeterinarianAppointmentStatus(Long appointmentId, UpdateBookingStatusRequest request) {
        Appointment appointment = authorizationService.getAppointmentAndRequireVeterinarian(appointmentId);

        AppointmentStatus targetStatus;
        try {
            targetStatus = AppointmentStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessRuleException("Invalid appointment status: " + request.getStatus());
        }

        validateVetTransition(appointment.getStatus(), targetStatus);

        appointment.setStatus(targetStatus);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            appointment.setNotes(request.getNotes().trim());
        }

        if (targetStatus == AppointmentStatus.CANCELLED) {
            paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(appointment.getId(), "VETERINARY")
                    .or(() -> paymentOrderRepository.findTopByBookingIdOrderByCreatedAtDesc(appointment.getId()))
                    .ifPresent(po -> {
                        if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                            try {
                                paymentService.refundPayment(po.getRazorpayOrderId(), "Appointment cancelled by veterinarian");
                            } catch (Exception e) {
                                log.error("Automatic refund failed for appointment {}: {}", appointment.getId(), e.getMessage());
                            }
                        }
                    });
            if (appointment.getPayment() != null && (appointment.getPayment().getStatus() == PaymentStatus.PAID || appointment.getPayment().getStatus() == PaymentStatus.SUCCESS)) {
                appointment.getPayment().setStatus(PaymentStatus.REFUNDED);
            }
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Veterinarian transitioned appointment {} to {}", updated.getAppointmentNo(), targetStatus);

        User petOwner = (updated.getPet() != null) ? updated.getPet().getOwner() : null;
        if (petOwner != null) {
            NotificationType notifType = switch (targetStatus) {
                case CONFIRMED -> NotificationType.BOOKING_CONFIRMED;
                case CANCELLED -> NotificationType.BOOKING_CANCELLED;
                default -> NotificationType.BOOKING_CONFIRMED;
            };
            String dedupeKey = "NOTIF-APT-" + updated.getId() + "-" + targetStatus.name();
            notificationService.createNotification(
                    petOwner,
                    notifType,
                    "Appointment " + targetStatus.name(),
                    String.format("Your appointment %s with Dr. %s has been %s.",
                            updated.getAppointmentNo(),
                            (updated.getVeterinarian() != null && updated.getVeterinarian().getUser() != null)
                                    ? updated.getVeterinarian().getUser().getFirstName() + " " + updated.getVeterinarian().getUser().getLastName()
                                    : "Veterinarian",
                            targetStatus.name().toLowerCase()),
                    "APPOINTMENT",
                    updated.getId(),
                    dedupeKey
            );
        }

        return appointmentMapper.toResponse(updated);
    }

    private Veterinarian getAuthenticatedVeterinarian() {
        Long userId = currentUserService.getCurrentUserId();
        return veterinarianRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Authenticated user is not registered as a veterinarian"));
    }

    private void validateNotPast(LocalDate date, LocalTime startTime) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BusinessRuleException("Cannot book or cancel an appointment for a date in the past");
        }
        if (date.isEqual(today) && startTime.isBefore(LocalTime.now())) {
            throw new BusinessRuleException("Cannot book or cancel an appointment for a time in the past");
        }
    }

    private boolean isTerminalState(AppointmentStatus status) {
        return status == AppointmentStatus.CANCELLED
                || status == AppointmentStatus.COMPLETED
                || status == AppointmentStatus.NO_SHOW;
    }

    private void validateVetTransition(AppointmentStatus current, AppointmentStatus target) {
        if (isTerminalState(current)) {
            throw new InvalidStateTransitionException("Cannot change status of an appointment in terminal state: " + current);
        }

        if (current == AppointmentStatus.PENDING) {
            if (target != AppointmentStatus.CONFIRMED && target != AppointmentStatus.CANCELLED) {
                throw new InvalidStateTransitionException("Pending appointment can only transition to CONFIRMED or CANCELLED");
            }
            return;
        }

        if (current == AppointmentStatus.CONFIRMED) {
            if (target != AppointmentStatus.COMPLETED && target != AppointmentStatus.CANCELLED && target != AppointmentStatus.NO_SHOW) {
                throw new InvalidStateTransitionException("Confirmed appointment can only transition to COMPLETED, CANCELLED, or NO_SHOW");
            }
            return;
        }

        throw new InvalidStateTransitionException("Invalid appointment transition from " + current + " to " + target);
    }

    private String generateAppointmentNo() {
        return "APT-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }
}
