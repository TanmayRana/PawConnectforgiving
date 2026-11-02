package com.example.PawConnect.repository;

import com.example.PawConnect.model.PetMedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetMedicalRecordRepository extends JpaRepository<PetMedicalRecord, Long> {
    List<PetMedicalRecord> findByPetId(Long petId);
    Page<PetMedicalRecord> findByPetId(Long petId, Pageable pageable);
    List<PetMedicalRecord> findByPetIdOrderByRecordDateDesc(Long petId);
    List<PetMedicalRecord> findByVeterinarianId(Long veterinarianId);
    Optional<PetMedicalRecord> findByIdAndPetId(Long id, Long petId);
}
