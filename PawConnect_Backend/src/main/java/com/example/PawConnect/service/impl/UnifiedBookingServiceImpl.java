package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateAppointmentRequest;
import com.example.PawConnect.dto.request.booking.CreateBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateServiceBookingRequest;
import com.example.PawConnect.dto.response.AppointmentResponse;
import com.example.PawConnect.dto.response.BookingSummaryResponse;
import com.example.PawConnect.dto.response.ServiceBookingResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.AppointmentMapper;
import com.example.PawConnect.mapper.ServiceBookingMapper;
import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.ServiceBooking;
import com.example.PawConnect.repository.AppointmentRepository;
import com.example.PawConnect.repository.ServiceBookingRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AppointmentService;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.ServiceBookingService;
import com.example.PawConnect.service.UnifiedBookingService;
import com.example.PawConnect.util.PaginationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnifiedBookingServiceImpl implements UnifiedBookingService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "date", "startTime", "endTime", "status", "createdAt", "updatedAt"
    );

    private final AppointmentService appointmentService;
    private final ServiceBookingService serviceBookingService;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final AppointmentMapper appointmentMapper;
    private final ServiceBookingMapper serviceBookingMapper;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;

    @Override
    @Transactional
    public BookingSummaryResponse createBooking(CreateBookingRequest request) {
        if ("VETERINARY".equalsIgnoreCase(request.getBookingType())) {
            if (request.getVeterinarianId() == null) {
                throw new BusinessRuleException("Veterinarian ID is required for VETERINARY booking");
            }
            CreateAppointmentRequest aptReq = CreateAppointmentRequest.builder()
                    .veterinarianId(request.getVeterinarianId())
                    .petId(request.getPetId())
                    .appointmentDate(request.getDate())
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .reason(request.getReason() != null ? request.getReason() : request.getNotes())
                    .build();
            AppointmentResponse resp = appointmentService.createAppointment(aptReq);
            Appointment entity = appointmentRepository.findById(resp.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Created appointment not found"));
            return appointmentMapper.toSummary(entity);
        } else if ("SERVICE".equalsIgnoreCase(request.getBookingType())) {
            if (request.getProviderId() == null) {
                throw new BusinessRuleException("Service provider ID is required for SERVICE booking");
            }
            if (request.getServiceId() == null) {
                throw new BusinessRuleException("Service ID is required for SERVICE booking");
            }
            CreateServiceBookingRequest sbReq = CreateServiceBookingRequest.builder()
                    .providerId(request.getProviderId())
                    .serviceId(request.getServiceId())
                    .petId(request.getPetId())
                    .bookingDate(request.getDate())
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .notes(request.getNotes() != null ? request.getNotes() : request.getReason())
                    .build();
            ServiceBookingResponse resp = serviceBookingService.createServiceBooking(sbReq);
            ServiceBooking entity = serviceBookingRepository.findById(resp.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Created service booking not found"));
            return serviceBookingMapper.toSummary(entity);
        } else {
            throw new BusinessRuleException("Unsupported bookingType: " + request.getBookingType() + ". Must be VETERINARY or SERVICE");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingSummaryResponse> getCustomerBookings(String bookingType, int page, int size, String sort) {
        Long ownerId = currentUserService.getCurrentUserId();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "date");

        if ("VETERINARY".equalsIgnoreCase(bookingType)) {
            Page<Appointment> aptPage = appointmentRepository.findByPetOwnerId(ownerId, pageable);
            return PageResponse.from(aptPage.map(appointmentMapper::toSummary));
        }

        if ("SERVICE".equalsIgnoreCase(bookingType)) {
            Page<ServiceBooking> sbPage = serviceBookingRepository.findByPetOwnerId(ownerId, pageable);
            return PageResponse.from(sbPage.map(serviceBookingMapper::toSummary));
        }

        // Aggregate both appointments and service bookings
        List<Appointment> appointments = appointmentRepository.findAllByPetOwnerId(ownerId);
        List<ServiceBooking> serviceBookings = serviceBookingRepository.findAllByPetOwnerId(ownerId);

        List<BookingSummaryResponse> all = new ArrayList<>();
        appointments.forEach(a -> all.add(appointmentMapper.toSummary(a)));
        serviceBookings.forEach(sb -> all.add(serviceBookingMapper.toSummary(sb)));

        all.sort(Comparator.comparing((BookingSummaryResponse b) -> b.getDate(), Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(b -> b.getStartTime(), Comparator.nullsLast(Comparator.reverseOrder())));

        int fromIndex = Math.min((int) pageable.getOffset(), all.size());
        int toIndex = Math.min(fromIndex + pageable.getPageSize(), all.size());
        List<BookingSummaryResponse> pageList = all.subList(fromIndex, toIndex);

        Page<BookingSummaryResponse> paged = new PageImpl<>(pageList, pageable, all.size());
        return PageResponse.from(paged);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingSummaryResponse getCustomerBooking(Long bookingId, String bookingType) {
        Long ownerId = currentUserService.getCurrentUserId();

        if ("VETERINARY".equalsIgnoreCase(bookingType)) {
            Appointment apt = authorizationService.getAppointmentAndRequireOwner(bookingId);
            return appointmentMapper.toSummary(apt);
        }

        if ("SERVICE".equalsIgnoreCase(bookingType)) {
            ServiceBooking sb = authorizationService.getServiceBookingAndRequireOwner(bookingId);
            return serviceBookingMapper.toSummary(sb);
        }

        // Try appointment first
        Optional<Appointment> aptOpt = appointmentRepository.findById(bookingId);
        if (aptOpt.isPresent()) {
            Appointment apt = aptOpt.get();
            if (apt.getPet() != null && apt.getPet().getOwner() != null && ownerId.equals(apt.getPet().getOwner().getId())) {
                return appointmentMapper.toSummary(apt);
            }
            throw new ForbiddenException("Access denied: you do not own this booking");
        }

        // Try service booking
        Optional<ServiceBooking> sbOpt = serviceBookingRepository.findById(bookingId);
        if (sbOpt.isPresent()) {
            ServiceBooking sb = sbOpt.get();
            if (sb.getPet() != null && sb.getPet().getOwner() != null && ownerId.equals(sb.getPet().getOwner().getId())) {
                return serviceBookingMapper.toSummary(sb);
            }
            throw new ForbiddenException("Access denied: you do not own this booking");
        }

        throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
    }

    @Override
    @Transactional
    public BookingSummaryResponse cancelCustomerBooking(Long bookingId, String bookingType, CancelBookingRequest request) {
        Long ownerId = currentUserService.getCurrentUserId();

        if ("VETERINARY".equalsIgnoreCase(bookingType)) {
            appointmentService.cancelCustomerAppointment(bookingId, request);
            Appointment apt = appointmentRepository.findById(bookingId).orElseThrow();
            return appointmentMapper.toSummary(apt);
        }

        if ("SERVICE".equalsIgnoreCase(bookingType)) {
            serviceBookingService.cancelCustomerServiceBooking(bookingId, request);
            ServiceBooking sb = serviceBookingRepository.findById(bookingId).orElseThrow();
            return serviceBookingMapper.toSummary(sb);
        }

        // Try appointment first
        Optional<Appointment> aptOpt = appointmentRepository.findById(bookingId);
        if (aptOpt.isPresent()) {
            Appointment apt = aptOpt.get();
            if (apt.getPet() != null && apt.getPet().getOwner() != null && !ownerId.equals(apt.getPet().getOwner().getId())) {
                throw new ForbiddenException("Access denied: you do not own this booking");
            }
            appointmentService.cancelCustomerAppointment(bookingId, request);
            Appointment updated = appointmentRepository.findById(bookingId).orElseThrow();
            return appointmentMapper.toSummary(updated);
        }

        // Try service booking
        Optional<ServiceBooking> sbOpt = serviceBookingRepository.findById(bookingId);
        if (sbOpt.isPresent()) {
            ServiceBooking sb = sbOpt.get();
            if (sb.getPet() != null && sb.getPet().getOwner() != null && !ownerId.equals(sb.getPet().getOwner().getId())) {
                throw new ForbiddenException("Access denied: you do not own this booking");
            }
            serviceBookingService.cancelCustomerServiceBooking(bookingId, request);
            ServiceBooking updated = serviceBookingRepository.findById(bookingId).orElseThrow();
            return serviceBookingMapper.toSummary(updated);
        }

        throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
    }
}
