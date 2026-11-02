package com.example.PawConnect.repository;

import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByOwnerId(Long ownerId);
    Page<Pet> findByOwnerId(Long ownerId, Pageable pageable);
    Page<Pet> findByOwnerIdAndStatus(Long ownerId, PetStatus status, Pageable pageable);
    Optional<Pet> findByIdAndOwnerId(Long id, Long ownerId);
    Optional<Pet> findByIdAndOwnerIdAndStatus(Long id, Long ownerId, PetStatus status);
    long countByOwnerIdAndStatus(Long ownerId, PetStatus status);
}
