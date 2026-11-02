package com.example.PawConnect.repository;

import com.example.PawConnect.model.PendingUserPassword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingUserPasswordRepository extends JpaRepository<PendingUserPassword, Long> {
    Optional<PendingUserPassword> findByEmail(String email);
}
