package com.example.PawConnect.service;

public interface OtpService {

    /**
     * Generates a secure 6-digit OTP for the given email, adhering to cooldown intervals.
     *
     * @param email user email address
     * @return the generated OTP (for internal delivery mechanisms)
     */
    String generateOtp(String email);

    /**
     * Verifies the submitted OTP against the stored active OTP for the email.
     * Enforces single-use, TTL expiration, and maximum attempt limits.
     *
     * @param email user email address
     * @param otp   the 6-digit code provided by the user
     * @return true if OTP is valid and within limits
     */
    boolean verifyOtp(String email, String otp);

    /**
     * Creates a single-use password reset token after successful OTP verification.
     *
     * @param email user email address
     * @return cryptographically random reset token
     */
    String createResetToken(String email);

    /**
     * Validates whether the given reset token is valid and unconsumed for the email.
     *
     * @param email      user email address
     * @param resetToken token to validate
     * @return true if valid
     */
    boolean validateResetToken(String email, String resetToken);

    /**
     * Consumes and clears all OTP and reset token state for the email.
     *
     * @param email user email address
     */
    void clearOtp(String email);

    /**
     * Retrieves the currently active OTP for test verification purposes only.
     */
    String getActiveOtpForTesting(String email);
}
