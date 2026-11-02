package com.example.PawConnect.repository;

import com.example.PawConnect.model.ServiceProviderAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceProviderAvailabilityRepository extends JpaRepository<ServiceProviderAvailability, Long> {
    List<ServiceProviderAvailability> findByProviderId(Long providerId);
    Optional<ServiceProviderAvailability> findByProviderIdAndDayOfWeek(Long providerId, DayOfWeek dayOfWeek);
}

