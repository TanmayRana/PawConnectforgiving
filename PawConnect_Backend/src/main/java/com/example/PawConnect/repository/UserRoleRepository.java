package com.example.PawConnect.repository;

import com.example.PawConnect.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserId(Long userId);

    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.user.id = :userId")
    List<UserRole> findByUserIdWithRole(@Param("userId") Long userId);

    @Query("SELECT COUNT(ur) FROM UserRole ur WHERE ur.role.roleCode = :roleCode AND ur.user.status = :status")
    long countActiveByRoleCode(@Param("roleCode") String roleCode, @Param("status") com.example.PawConnect.model.UserStatus status);

    @Query("SELECT COUNT(ur) FROM UserRole ur WHERE ur.role.roleCode = :roleCode")
    long countByRoleCode(@Param("roleCode") String roleCode);

    void deleteByUserId(Long userId);
}
