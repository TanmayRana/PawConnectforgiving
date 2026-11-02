package com.example.PawConnect.repository;

import com.example.PawConnect.model.PromoCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long>, JpaSpecificationExecutor<PromoCode> {

    Optional<PromoCode> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PromoCode p WHERE UPPER(TRIM(p.code)) = UPPER(TRIM(:code))")
    Optional<PromoCode> findByCodeForUpdate(@Param("code") String code);

    @Modifying
    @Query("UPDATE PromoCode p SET p.usedCount = p.usedCount + 1 WHERE p.id = :id AND (p.usageLimit IS NULL OR p.usedCount < p.usageLimit)")
    int incrementUsedCountSafely(@Param("id") Long id);

    @Modifying
    @Query("UPDATE PromoCode p SET p.usedCount = CASE WHEN p.usedCount > 0 THEN p.usedCount - 1 ELSE 0 END WHERE p.id = :id")
    int decrementUsedCountSafely(@Param("id") Long id);

    @Modifying
    @Query("UPDATE PromoCode p SET p.usedCount = CASE WHEN p.usedCount > 0 THEN p.usedCount - 1 ELSE 0 END WHERE UPPER(TRIM(p.code)) = UPPER(TRIM(:code))")
    int decrementUsedCountByCodeSafely(@Param("code") String code);
}
