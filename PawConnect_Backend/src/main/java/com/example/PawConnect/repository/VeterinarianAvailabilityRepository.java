package com.example.PawConnect.repository;

import com.example.PawConnect.model.VeterinarianAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface VeterinarianAvailabilityRepository extends JpaRepository<VeterinarianAvailability, Long> {
    List<VeterinarianAvailability> findByVeterinarianId(Long veterinarianId);
    Optional<VeterinarianAvailability> findByVeterinarianIdAndDayOfWeek(Long veterinarianId, DayOfWeek dayOfWeek);
}

