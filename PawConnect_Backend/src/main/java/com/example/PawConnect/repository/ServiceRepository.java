package com.example.PawConnect.repository;

import com.example.PawConnect.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByProviderId(Long providerId);
    List<Service> findByCategoryId(Long categoryId);
}
