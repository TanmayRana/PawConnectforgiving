package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.CreateUserRequest;
import com.example.PawConnect.dto.request.admin.IssueUserPasswordRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserStatusRequest;
import com.example.PawConnect.dto.request.admin.VerifyUserPasswordRequest;
import com.example.PawConnect.dto.response.IssuedUserPasswordResponse;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AdminUserService {

    PageResponse<UserResponse> getUsers(
            String search,
            String role,
            UserStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    UserResponse getUserById(Long userId);

    UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request);

    IssuedUserPasswordResponse issueUserPassword(IssueUserPasswordRequest request);

    void verifyIssuedPassword(VerifyUserPasswordRequest request);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long userId, UpdateUserRequest request);
}
