package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateServiceBookingRequest;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.InvalidStateTransitionException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.exception.SlotConflictException;
import com.example.PawConnect.mapper.ServiceBookingMapper;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetStatus;
import com.example.PawConnect.model.Service;
import com.example.PawConnect.model.ServiceProvider;
import com.example.PawConnect.model.ServiceProviderAvailability;
import com.example.PawConnect.model.ServiceProviderVerificationStatus;
import com.example.PawConnect.model.ServiceBooking;
import com.example.PawConnect.repository.ServiceBookingRepository;
import com.example.PawConnect.repository.ServiceProviderAvailabilityRepository;
import com.example.PawConnect.repository.ServiceProviderRepository;
import com.example.PawConnect.repository.ServiceRepository;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.User;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.service.ServiceBookingService;
import com.example.PawConnect.util.PaginationUtils;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.repository.PaymentOrderRepository;
import com.example.PawConnect.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@org.springframework.stereotype.Service
public class ServiceBookingServiceImpl implements ServiceBookingService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "bookingNo", "bookingDate", "startTime", "endTime", "price", "status", "createdAt", "updatedAt"
    );

    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final ServiceBookingRepository serviceBookingRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceProviderAvailabilityRepository serviceProviderAvailabilityRepository;
    private final ServiceBookingMapper serviceBookingMapper;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final PaymentOrderRepository paymentOrderRepository;

    public ServiceBookingServiceImpl(
            CurrentUserService currentUserService,
            AuthorizationService authorizationService,
            ServiceBookingRepository serviceBookingRepository,
            ServiceProviderRepository serviceProviderRepository,
            ServiceRepository serviceRepository,
            ServiceProviderAvailabilityRepository serviceProviderAvailabilityRepository,
            ServiceBookingMapper serviceBookingMapper,
            NotificationService notificationService,
            @Lazy PaymentService paymentService,
            PaymentOrderRepository paymentOrderRepository
    ) {
        this.currentUserService = currentUserService;
        this.authorizationService = authorizationService;
        this.serviceBookingRepository = serviceBookingRepository;
        this.serviceProviderRepository = serviceProviderRepository;
        this.serviceRepository = serviceRepository;
        this.serviceProviderAvailabilityRepository = serviceProviderAvailabilityRepository;
        this.serviceBookingMapper = serviceBookingMapper;
        this.notificationService = notificationService;
        this.paymentService = paymentService;
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @Override
    @Transactional
    public ServiceBookingResponse createServiceBooking(CreateServiceBookingRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(request.getPetId());
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new BusinessRuleException("Cannot book a service for an inactive pet profile");
        }

        LocalDate bookingDate = request.getBookingDate();
        LocalTime startTime = request.getStartTime();
        validateNotPast(bookingDate, startTime);

        // Pessimistic lock on the provider record prevents concurrent booking overlap
        ServiceProvider provider = serviceProviderRepository.findByIdForUpdate(request.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Service provider not found with id: " + request.getProviderId()));

        if (!Boolean.TRUE.equals(provider.getIsActive())) {
            throw new BusinessRuleException("Selected service provider is currently inactive");
        }

        if (provider.getVerificationStatus() != ServiceProviderVerificationStatus.APPROVED) {
            throw new BusinessRuleException("Selected service provider is not verified for client bookings");
        }

        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + request.getServiceId()));

        if (!service.getProvider().getId().equals(provider.getId())) {
            throw new BusinessRuleException("Selected service does not belong to the selected service provider");
        }

        if (!Boolean.TRUE.equals(service.getIsActive())) {
            throw new BusinessRuleException("Selected service is currently inactive");
        }

        LocalTime endTime = request.getEndTime();
        if (endTime == null) {
            int duration = service.getDurationMinutes() != null ? service.getDurationMinutes() : 60;
            endTime = startTime.plusMinutes(duration);
        } else {
            if (!endTime.isAfter(startTime)) {
                throw new BusinessRuleException("Booking end time must be after start time");
            }
        }

        Optional<ServiceProviderAvailability> availOpt = serviceProviderAvailabilityRepository
                .findByProviderIdAndDayOfWeek(provider.getId(), bookingDate.getDayOfWeek());

        if (availOpt.isPresent()) {
            ServiceProviderAvailability availability = availOpt.get();
            if (!Boolean.TRUE.equals(availability.getIsAvailable())) {
                throw new BusinessRuleException("Service provider is not available on " + bookingDate.getDayOfWeek());
            }
            if (startTime.isBefore(availability.getStartTime()) || endTime.isAfter(availability.getEndTime())) {
                throw new BusinessRuleException(String.format(
                        "Requested time (%s - %s) falls outside provider working hours (%s - %s)",
                        startTime, endTime, availability.getStartTime(), availability.getEndTime()
                ));
            }
        }

        List<ServiceBooking> conflicts = serviceBookingRepository.findOverlappingBookings(
                provider.getId(),
                bookingDate,
                startTime,
                endTime
        );

        if (!conflicts.isEmpty()) {
            throw new SlotConflictException("The selected service provider already has a booking during the requested time slot");
        }

        String bookingNo = generateBookingNo();

        ServiceBooking booking = ServiceBooking.builder()
                .bookingNo(bookingNo)
                .pet(pet)
                .provider(provider)
                .service(service)
                .bookingDate(bookingDate)
                .startTime(startTime)
                .endTime(endTime)
                .price(service.getPrice())
                .status(BookingStatus.PENDING)
                .notes(request.getNotes())
                .build();

        ServiceBooking saved = serviceBookingRepository.save(booking);
        log.info("Created service booking {} for pet {} with provider {}", saved.getBookingNo(), pet.getId(), provider.getId());

        if (provider.getUser() != null) {
            String dedupeKey = "NOTIF-SB-" + saved.getId() + "-CREATED";
            notificationService.createNotification(
                    provider.getUser(),
                    NotificationType.BOOKING_CREATED,
                    "New Service Booking Request",
                    String.format("New booking %s requested for %s on %s at %s.",
                            saved.getBookingNo(), pet.getName(), saved.getBookingDate(), saved.getStartTime()),
                    "SERVICE_BOOKING",
                    saved.getId(),
                    dedupeKey
            );
        }

        return serviceBookingMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceBookingResponse> getCustomerServiceBookings(BookingStatus status, int page, int size, String sort) {
        Long ownerId = currentUserService.getCurrentUserId();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "bookingDate");

        Page<ServiceBooking> bookingPage = (status != null)
                ? serviceBookingRepository.findByPetOwnerIdAndStatus(ownerId, status, pageable)
                : serviceBookingRepository.findByPetOwnerId(ownerId, pageable);

        return PageResponse.from(bookingPage.map(serviceBookingMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceBookingResponse getCustomerServiceBooking(Long bookingId) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireOwner(bookingId);
        return serviceBookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public ServiceBookingResponse cancelCustomerServiceBooking(Long bookingId, CancelBookingRequest request) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireOwner(bookingId);

        if (isTerminalState(booking.getStatus())) {
            throw new InvalidStateTransitionException("Cannot cancel a booking that is already in terminal status: " + booking.getStatus());
        }

        validateNotPast(booking.getBookingDate(), booking.getStartTime());

        booking.setStatus(BookingStatus.CANCELLED);
        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            String note = "Cancelled by customer: " + request.getReason().trim();
            booking.setNotes(booking.getNotes() != null ? booking.getNotes() + " | " + note : note);
        }

        // Trigger auto-refund if service booking payment was completed
        paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(booking.getId(), "SERVICE")
                .or(() -> paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(booking.getId(), "SERVICE_BOOKING"))
                .or(() -> paymentOrderRepository.findTopByBookingIdOrderByCreatedAtDesc(booking.getId()))
                .ifPresent(po -> {
                    if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                        try {
                            paymentService.refundPayment(po.getRazorpayOrderId(), "Service booking cancelled by customer");
                        } catch (Exception e) {
                            log.error("Automatic refund failed for service booking {}: {}", booking.getId(), e.getMessage());
                        }
                    }
                });
        if (booking.getPayment() != null && (booking.getPayment().getStatus() == PaymentStatus.PAID || booking.getPayment().getStatus() == PaymentStatus.SUCCESS)) {
            booking.getPayment().setStatus(PaymentStatus.REFUNDED);
        }

        ServiceBooking updated = serviceBookingRepository.save(booking);
        log.info("Customer cancelled service booking {}", updated.getBookingNo());

        if (updated.getProvider() != null && updated.getProvider().getUser() != null) {
            String dedupeKey = "NOTIF-SB-" + updated.getId() + "-CANCELLED";
            notificationService.createNotification(
                    updated.getProvider().getUser(),
                    NotificationType.BOOKING_CANCELLED,
                    "Service Booking Cancelled",
                    String.format("Service booking %s has been cancelled by the customer.", updated.getBookingNo()),
                    "SERVICE_BOOKING",
                    updated.getId(),
                    dedupeKey
            );
        }

        return serviceBookingMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceBookingResponse> getProviderBookings(BookingStatus status, int page, int size, String sort) {
        ServiceProvider provider = getAuthenticatedProvider();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "bookingDate");

        Page<ServiceBooking> bookingPage = (status != null)
                ? serviceBookingRepository.findByProviderIdAndStatus(provider.getId(), status, pageable)
                : serviceBookingRepository.findByProviderId(provider.getId(), pageable);

        return PageResponse.from(bookingPage.map(serviceBookingMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceBookingResponse getProviderBooking(Long bookingId) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireProvider(bookingId);
        return serviceBookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public ServiceBookingResponse updateProviderBookingStatus(Long bookingId, UpdateBookingStatusRequest request) {
        ServiceBooking booking = authorizationService.getServiceBookingAndRequireProvider(bookingId);

        BookingStatus targetStatus;
        try {
            targetStatus = BookingStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessRuleException("Invalid booking status: " + request.getStatus());
        }

        validateProviderTransition(booking.getStatus(), targetStatus);

        booking.setStatus(targetStatus);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            booking.setNotes(request.getNotes().trim());
        }

        if (targetStatus == BookingStatus.CANCELLED) {
            paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(booking.getId(), "SERVICE")
                    .or(() -> paymentOrderRepository.findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(booking.getId(), "SERVICE_BOOKING"))
                    .or(() -> paymentOrderRepository.findTopByBookingIdOrderByCreatedAtDesc(booking.getId()))
                    .ifPresent(po -> {
                        if (po.getStatus() == PaymentStatus.PAID || po.getStatus() == PaymentStatus.SUCCESS) {
                            try {
                                paymentService.refundPayment(po.getRazorpayOrderId(), "Service booking cancelled by service provider");
                            } catch (Exception e) {
                                log.error("Automatic refund failed for service booking {}: {}", booking.getId(), e.getMessage());
                            }
                        }
                    });
            if (booking.getPayment() != null && (booking.getPayment().getStatus() == PaymentStatus.PAID || booking.getPayment().getStatus() == PaymentStatus.SUCCESS)) {
                booking.getPayment().setStatus(PaymentStatus.REFUNDED);
            }
        }

        ServiceBooking updated = serviceBookingRepository.save(booking);
        log.info("Service provider transitioned booking {} to {}", updated.getBookingNo(), targetStatus);

        User petOwner = (updated.getPet() != null) ? updated.getPet().getOwner() : null;
        if (petOwner != null) {
            NotificationType notifType = switch (targetStatus) {
                case CONFIRMED -> NotificationType.BOOKING_CONFIRMED;
                case CANCELLED -> NotificationType.BOOKING_CANCELLED;
                default -> NotificationType.BOOKING_CONFIRMED;
            };
            String dedupeKey = "NOTIF-SB-" + updated.getId() + "-" + targetStatus.name();
            notificationService.createNotification(
                    petOwner,
                    notifType,
                    "Service Booking " + targetStatus.name(),
                    String.format("Your service booking %s has been %s.",
                            updated.getBookingNo(), targetStatus.name().toLowerCase()),
                    "SERVICE_BOOKING",
                    updated.getId(),
                    dedupeKey
            );
        }

        return serviceBookingMapper.toResponse(updated);
    }

    private ServiceProvider getAuthenticatedProvider() {
        Long userId = currentUserService.getCurrentUserId();
        return serviceProviderRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Authenticated user is not registered as a service provider"));
    }

    private void validateNotPast(LocalDate date, LocalTime startTime) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BusinessRuleException("Cannot book or cancel a service for a date in the past");
        }
        if (date.isEqual(today) && startTime.isBefore(LocalTime.now())) {
            throw new BusinessRuleException("Cannot book or cancel a service for a time in the past");
        }
    }

    private boolean isTerminalState(BookingStatus status) {
        return status == BookingStatus.CANCELLED
                || status == BookingStatus.COMPLETED
                || status == BookingStatus.NO_SHOW;
    }

    private void validateProviderTransition(BookingStatus current, BookingStatus target) {
        if (isTerminalState(current)) {
            throw new InvalidStateTransitionException("Cannot change status of a service booking in terminal state: " + current);
        }

        if (current == BookingStatus.PENDING) {
            if (target != BookingStatus.CONFIRMED && target != BookingStatus.CANCELLED) {
                throw new InvalidStateTransitionException("Pending service booking can only transition to CONFIRMED or CANCELLED");
            }
            return;
        }

        if (current == BookingStatus.CONFIRMED) {
            if (target != BookingStatus.COMPLETED && target != BookingStatus.CANCELLED && target != BookingStatus.NO_SHOW) {
                throw new InvalidStateTransitionException("Confirmed service booking can only transition to COMPLETED, CANCELLED, or NO_SHOW");
            }
            return;
        }

        throw new InvalidStateTransitionException("Invalid service booking transition from " + current + " to " + target);
    }

    private String generateBookingNo() {
        return "SB-" + System.currentTimeMillis() % 100000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }
}
