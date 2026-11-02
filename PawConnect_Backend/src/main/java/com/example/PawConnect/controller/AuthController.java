package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.auth.*;
import com.example.PawConnect.dto.response.AuthResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/otp")
    public ResponseEntity<ApiResponse<Void>> requestRegisterOtp(@Valid @RequestBody RegisterRequest request) {
        authService.requestRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(
                null,
                "Verification code emailed. Enter it to finish creating the account."
        ));
    }

    @PostMapping("/register/otp/resend")
    public ResponseEntity<ApiResponse<Void>> resendRegisterOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "A new verification code was emailed."));
    }

    @PostMapping("/register/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyRegisterOtp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Registration successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.requestRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(
                null,
                "Verification code emailed. Enter it to finish creating the account."
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "If an account exists with this email, a password reset OTP has been sent."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String resetToken = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("resetToken", resetToken), "OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset successfully. Please log in with your new password."));
    }
}
