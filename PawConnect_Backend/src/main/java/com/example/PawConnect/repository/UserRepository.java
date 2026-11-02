package com.example.PawConnect.repository;

import com.example.PawConnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    long countByStatus(com.example.PawConnect.model.UserStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT u.id FROM User u WHERE LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :q, '%'))")
    java.util.List<Long> findIdsBySearchTerm(@org.springframework.data.repository.query.Param("q") String q);

    java.util.List<User> findByStatus(com.example.PawConnect.model.UserStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE UPPER(r.roleCode) = UPPER(:roleCode) AND u.status = :status")
    java.util.List<User> findByRoleCodeAndStatus(@org.springframework.data.repository.query.Param("roleCode") String roleCode, @org.springframework.data.repository.query.Param("status") com.example.PawConnect.model.UserStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE UPPER(r.roleCode) = UPPER(:roleCode)")
    java.util.List<User> findByRoleCode(@org.springframework.data.repository.query.Param("roleCode") String roleCode);
}
