package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.auth.*;
import com.example.PawConnect.dto.response.AuthResponse;

public interface AuthService {

    void requestRegisterOtp(RegisterRequest request);

    AuthResponse verifyRegisterOtp(VerifyOtpRequest request);

    void resendRegisterOtp(ForgotPasswordRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    String verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
