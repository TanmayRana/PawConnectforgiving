package com.example.PawConnect.repository;

import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.model.ServiceProvider;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long>, JpaSpecificationExecutor<ServiceProvider> {
    Optional<ServiceProvider> findByUserId(Long userId);
    List<ServiceProvider> findByProviderType(ProviderType providerType);

    long countByVerificationStatus(com.example.PawConnect.model.ServiceProviderVerificationStatus status);
    long countByIsActiveTrueAndVerificationStatus(com.example.PawConnect.model.ServiceProviderVerificationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ServiceProvider p WHERE p.id = :id")
    Optional<ServiceProvider> findByIdForUpdate(@Param("id") Long id);
}
