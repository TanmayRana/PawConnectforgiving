package com.example.PawConnect.repository;

import com.example.PawConnect.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"product", "product.category", "product.images"})
    List<CartItem> findByCartId(Long cartId);
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    List<CartItem> findByProductId(Long productId);
    void deleteByCartId(Long cartId);
    void deleteByProductId(Long productId);
}
