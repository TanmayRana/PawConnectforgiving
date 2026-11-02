package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.CreateUserRequest;
import com.example.PawConnect.dto.request.admin.IssueUserPasswordRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserStatusRequest;
import com.example.PawConnect.dto.request.admin.VerifyUserPasswordRequest;
import com.example.PawConnect.dto.response.IssuedUserPasswordResponse;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<UserResponse> users = adminUserService.getUsers(search, role, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        UserResponse user = adminUserService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        UserResponse response = adminUserService.updateUserStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/password-email")
    public ResponseEntity<ApiResponse<IssuedUserPasswordResponse>> issueUserPassword(
            @Valid @RequestBody IssueUserPasswordRequest request
    ) {
        IssuedUserPasswordResponse response = adminUserService.issueUserPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Password emailed to " + response.getEmail() + ". Paste it from the inbox to continue."
        ));
    }

    @PostMapping("/password-email/verify")
    public ResponseEntity<ApiResponse<Void>> verifyIssuedPassword(
            @Valid @RequestBody VerifyUserPasswordRequest request
    ) {
        adminUserService.verifyIssuedPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password matches the email. You can create the user."));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request
    ) {
        UserResponse response = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserResponse response = adminUserService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
