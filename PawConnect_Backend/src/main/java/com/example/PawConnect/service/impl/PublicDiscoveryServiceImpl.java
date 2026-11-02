package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.CreateReviewRequest;
import com.example.PawConnect.dto.response.PublicReviewResponse;
import com.example.PawConnect.dto.response.PublicServiceProviderResponse;
import com.example.PawConnect.dto.response.PublicVeterinarianResponse;
import com.example.PawConnect.exception.DuplicateResourceException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.PublicDiscoveryService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicDiscoveryServiceImpl implements PublicDiscoveryService {

    private final VeterinarianRepository veterinarianRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PublicVeterinarianResponse> getVeterinarians(String search, String specialization, Pageable pageable) {
        Specification<Veterinarian> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("verificationStatus"), VeterinarianVerificationStatus.APPROVED));
            predicates.add(cb.equal(root.get("isActive"), true));

            if (specialization != null && !specialization.isBlank() && !specialization.equalsIgnoreCase("All Specialties")) {
                predicates.add(cb.like(cb.lower(root.get("specialization")), "%" + specialization.trim().toLowerCase() + "%"));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<Veterinarian, User> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("specialization")), pattern),
                        cb.like(cb.lower(root.get("clinicName")), pattern),
                        cb.like(cb.lower(root.get("clinicAddress")), pattern),
                        cb.like(cb.lower(userJoin.get("firstName")), pattern),
                        cb.like(cb.lower(userJoin.get("lastName")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Veterinarian> page = veterinarianRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::mapVeterinarian));
    }

    @Override
    @Transactional(readOnly = true)
    public PublicVeterinarianResponse getVeterinarianById(Long id) {
        Veterinarian vet = veterinarianRepository.findById(id)
                .filter(v -> v.getVerificationStatus() == VeterinarianVerificationStatus.APPROVED && Boolean.TRUE.equals(v.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Veterinarian not found with id: " + id));
        return mapVeterinarian(vet);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PublicServiceProviderResponse> getServiceProviders(String search, ProviderType providerType, Pageable pageable) {
        Specification<ServiceProvider> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("verificationStatus"), ServiceProviderVerificationStatus.APPROVED));
            predicates.add(cb.equal(root.get("isActive"), true));

            if (providerType != null) {
                predicates.add(cb.equal(root.get("providerType"), providerType));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<ServiceProvider, User> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("businessName")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("address")), pattern),
                        cb.like(cb.lower(userJoin.get("firstName")), pattern),
                        cb.like(cb.lower(userJoin.get("lastName")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceProvider> page = serviceProviderRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::mapServiceProvider));
    }

    @Override
    @Transactional(readOnly = true)
    public PublicServiceProviderResponse getServiceProviderById(Long id) {
        ServiceProvider provider = serviceProviderRepository.findById(id)
                .filter(p -> p.getVerificationStatus() == ServiceProviderVerificationStatus.APPROVED && Boolean.TRUE.equals(p.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Service provider not found with id: " + id));
        return mapServiceProvider(provider);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PublicReviewResponse> getReviews(Long veterinarianId, Long providerId, Long productId, Pageable pageable) {
        Page<Review> page;
        if (veterinarianId != null) {
            page = reviewRepository.findVisibleByVeterinarianId(veterinarianId, pageable);
        } else if (providerId != null) {
            page = reviewRepository.findVisibleByProviderId(providerId, pageable);
        } else if (productId != null) {
            page = reviewRepository.findVisibleByProductId(productId, pageable);
        } else {
            page = reviewRepository.findByStatus(ReviewStatus.VISIBLE, pageable);
        }

        return PageResponse.from(page.map(this::mapReview));
    }

    @Override
    @Transactional
    public PublicReviewResponse submitReview(CreateReviewRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        User user = currentUserService.getCurrentUser();

        Review.ReviewBuilder builder = Review.builder()
                .user(user)
                .rating(request.getRating())
                .reviewText(request.getReviewText().trim())
                .status(ReviewStatus.VISIBLE);

        if (request.getAppointmentId() != null) {
            Appointment appt = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + request.getAppointmentId()));
            if (!appt.getPet().getOwner().getId().equals(userId)) {
                throw new IllegalArgumentException("You can only review your own appointments");
            }
            if (appt.getStatus() != AppointmentStatus.COMPLETED) {
                throw new IllegalArgumentException("Only completed appointments can be reviewed");
            }
            if (!reviewRepository.findByAppointmentId(appt.getId()).isEmpty()) {
                throw new DuplicateResourceException("You have already reviewed this appointment");
            }
            builder.appointment(appt);
        } else if (request.getServiceBookingId() != null) {
            ServiceBooking booking = serviceBookingRepository.findById(request.getServiceBookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + request.getServiceBookingId()));
            if (!booking.getPet().getOwner().getId().equals(userId)) {
                throw new IllegalArgumentException("You can only review your own service bookings");
            }
            if (booking.getStatus() != BookingStatus.COMPLETED) {
                throw new IllegalArgumentException("Only completed service bookings can be reviewed");
            }
            if (!reviewRepository.findByServiceBookingId(booking.getId()).isEmpty()) {
                throw new DuplicateResourceException("You have already reviewed this service booking");
            }
            builder.serviceBooking(booking);
        } else if (request.getOrderItemId() != null) {
            OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + request.getOrderItemId()));
            if (!orderItem.getOrder().getUser().getId().equals(userId)) {
                throw new IllegalArgumentException("You can only review items from your own orders");
            }
            if (orderItem.getOrder().getOrderStatus() != OrderStatus.DELIVERED) {
                throw new IllegalArgumentException("Only delivered order items can be reviewed");
            }
            if (!reviewRepository.findByOrderItemId(orderItem.getId()).isEmpty()) {
                throw new DuplicateResourceException("You have already reviewed this ordered item");
            }
            builder.orderItem(orderItem);
        } else {
            throw new IllegalArgumentException("A valid appointment, service booking, or order item is required to submit a review");
        }

        Review saved = reviewRepository.save(builder.build());
        log.info("User {} submitted review id {}", userId, saved.getId());
        return mapReview(saved);
    }

    private PublicVeterinarianResponse mapVeterinarian(Veterinarian vet) {
        String fullName = vet.getUser() != null
                ? ((vet.getUser().getFirstName() != null ? vet.getUser().getFirstName() : "") + " " +
                   (vet.getUser().getLastName() != null ? vet.getUser().getLastName() : "")).trim()
                : "Veterinarian";

        Double avgRating = reviewRepository.getAverageRatingForVeterinarian(vet.getId());
        Long reviewCount = reviewRepository.countReviewsForVeterinarian(vet.getId());

        double rating = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0;
        long count = reviewCount != null ? reviewCount : 0L;

        return PublicVeterinarianResponse.builder()
                .id(vet.getId())
                .name(fullName)
                .email(vet.getUser() != null ? vet.getUser().getEmail() : null)
                .phone(vet.getUser() != null ? vet.getUser().getPhone() : null)
                .specialization(vet.getSpecialization())
                .qualification(vet.getQualification())
                .licenseNumber(vet.getLicenseNumber())
                .experienceYears(vet.getExperienceYears())
                .clinicName(vet.getClinicName())
                .clinicAddress(vet.getClinicAddress())
                .clinicLatitude(vet.getClinicLatitude())
                .clinicLongitude(vet.getClinicLongitude())
                .consultationFee(vet.getConsultationFee())
                .bio(vet.getBio())
                .rating(rating)
                .reviewCount(count)
                .isAvailableToday(false)
                .profileImageUrl(vet.getUser() != null ? vet.getUser().getProfileImage() : null)
                .build();
    }

    private PublicServiceProviderResponse mapServiceProvider(ServiceProvider provider) {
        String fullName = provider.getUser() != null
                ? ((provider.getUser().getFirstName() != null ? provider.getUser().getFirstName() : "") + " " +
                   (provider.getUser().getLastName() != null ? provider.getUser().getLastName() : "")).trim()
                : provider.getBusinessName();

        Double avgRating = reviewRepository.getAverageRatingForProvider(provider.getId());
        Long reviewCount = reviewRepository.countReviewsForProvider(provider.getId());

        double rating = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0;
        long count = reviewCount != null ? reviewCount : 0L;

        return PublicServiceProviderResponse.builder()
                .id(provider.getId())
                .name(fullName)
                .providerType(provider.getProviderType())
                .businessName(provider.getBusinessName())
                .description(provider.getDescription())
                .phone(provider.getPhone())
                .address(provider.getAddress())
                .latitude(provider.getLatitude())
                .longitude(provider.getLongitude())
                .experienceYears(provider.getExperienceYears())
                .rating(rating)
                .reviewCount(count)
                .profileImageUrl(provider.getUser() != null ? provider.getUser().getProfileImage() : null)
                .build();
    }

    private PublicReviewResponse mapReview(Review review) {
        String reviewerName = "Anonymous";
        if (review.getUser() != null) {
            String first = review.getUser().getFirstName() != null ? review.getUser().getFirstName() : "";
            String last = review.getUser().getLastName() != null && !review.getUser().getLastName().isBlank()
                    ? review.getUser().getLastName().substring(0, 1) + "."
                    : "";
            reviewerName = (first + " " + last).trim();
            if (reviewerName.isBlank()) reviewerName = "Pet Parent";
        }

        String targetType = null;
        Long targetId = null;
        String targetTitle = null;

        if (review.getAppointment() != null && review.getAppointment().getVeterinarian() != null) {
            targetType = "VETERINARIAN";
            targetId = review.getAppointment().getVeterinarian().getId();
            targetTitle = review.getAppointment().getVeterinarian().getClinicName();
        } else if (review.getServiceBooking() != null && review.getServiceBooking().getProvider() != null) {
            targetType = "SERVICE_PROVIDER";
            targetId = review.getServiceBooking().getProvider().getId();
            targetTitle = review.getServiceBooking().getProvider().getBusinessName();
        } else if (review.getOrderItem() != null && review.getOrderItem().getProduct() != null) {
            targetType = "PRODUCT";
            targetId = review.getOrderItem().getProduct().getId();
            targetTitle = review.getOrderItem().getProduct().getName();
        }

        return PublicReviewResponse.builder()
                .id(review.getId())
                .reviewerName(reviewerName)
                .rating(review.getRating())
                .reviewText(review.getReviewText())
                .createdAt(review.getCreatedAt())
                .targetType(targetType)
                .targetId(targetId)
                .targetTitle(targetTitle)
                .build();
    }
}
