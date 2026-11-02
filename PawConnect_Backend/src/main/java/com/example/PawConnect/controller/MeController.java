package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.user.ChangePasswordRequest;
import com.example.PawConnect.dto.request.user.UpdateProfileRequest;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "Customer Profile", description = "Current authenticated user profile and password management")
@PreAuthorize("isAuthenticated()")
public class MeController {

    private final CurrentUserService currentUserService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = currentUserService.getCurrentUserResponse();
        return ResponseEntity.ok(ApiResponse.ok(response, "Current user retrieved successfully"));
    }

    @PutMapping
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Profile updated successfully"));
    }

    @PutMapping("/password")
    @Operation(summary = "Change current user password and invalidate prior sessions")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully. Prior sessions have been revoked."));
    }
}
