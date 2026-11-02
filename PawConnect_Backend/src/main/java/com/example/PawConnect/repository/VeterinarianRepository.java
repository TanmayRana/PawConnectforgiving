package com.example.PawConnect.repository;

import com.example.PawConnect.model.Veterinarian;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VeterinarianRepository extends JpaRepository<Veterinarian, Long>, JpaSpecificationExecutor<Veterinarian> {
    Optional<Veterinarian> findByUserId(Long userId);
    Optional<Veterinarian> findByLicenseNumber(String licenseNumber);
    boolean existsByLicenseNumber(String licenseNumber);

    long countByVerificationStatus(com.example.PawConnect.model.VeterinarianVerificationStatus status);
    long countByIsActiveTrueAndVerificationStatus(com.example.PawConnect.model.VeterinarianVerificationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Veterinarian v WHERE v.id = :id")
    Optional<Veterinarian> findByIdForUpdate(@Param("id") Long id);
}
