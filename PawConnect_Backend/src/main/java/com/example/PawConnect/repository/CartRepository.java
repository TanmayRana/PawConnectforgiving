package com.example.PawConnect.repository;

import com.example.PawConnect.model.Cart;
import com.example.PawConnect.model.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findByUserId(Long userId);
    Optional<Cart> findByUserIdAndStatus(Long userId, CartStatus status);
    List<Cart> findAllByUserIdAndStatus(Long userId, CartStatus status);
    Optional<Cart> findTopByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, CartStatus status);
    void deleteByUserIdAndStatus(Long userId, CartStatus status);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Cart c WHERE c.id = :id")
    Optional<Cart> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
}
