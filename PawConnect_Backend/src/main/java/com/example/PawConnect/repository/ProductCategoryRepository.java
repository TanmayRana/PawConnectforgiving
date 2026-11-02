package com.example.PawConnect.repository;

import com.example.PawConnect.model.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    Optional<ProductCategory> findByName(String name);
    List<ProductCategory> findByIsActiveTrue();
    List<ProductCategory> findAllByOrderByNameAsc();
}
