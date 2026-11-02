package com.example.PawConnect.repository;

import com.example.PawConnect.model.PetVaccination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetVaccinationRepository extends JpaRepository<PetVaccination, Long> {
    List<PetVaccination> findByPetId(Long petId);
    Page<PetVaccination> findByPetId(Long petId, Pageable pageable);
    List<PetVaccination> findByPetIdOrderByVaccinationDateDesc(Long petId);
    Optional<PetVaccination> findByIdAndPetId(Long id, Long petId);
}
