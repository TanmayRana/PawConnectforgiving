package com.example.PawConnect.service.impl;

import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.service.OtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory OTP and Password Reset Token manager.
 * <p>
 * NOTE FOR PRODUCTION: In a multi-node production deployment, this in-memory
 * state should be replaced with a distributed key-value store such as Redis
 * to share OTP verification state across instances.
 */
@Service
public class InMemoryOtpService implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(InMemoryOtpService.class);
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(10);
    private static final int MAX_ATTEMPTS = 3;

    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ResetTokenRecord> resetTokenStore = new ConcurrentHashMap<>();

    private static class OtpRecord {
        final String otp;
        final Instant expiresAt;
        final Instant createdAt;
        int attempts;

        OtpRecord(String otp, Instant expiresAt, Instant createdAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.createdAt = createdAt;
            this.attempts = 0;
        }
    }

    private static class ResetTokenRecord {
        final String token;
        final Instant expiresAt;

        ResetTokenRecord(String token, Instant expiresAt) {
            this.token = token;
            this.expiresAt = expiresAt;
        }
    }

    @Override
    public String generateOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        Instant now = Instant.now();

        OtpRecord existing = otpStore.get(normalizedEmail);
        if (existing != null && now.isBefore(existing.createdAt.plus(RESEND_COOLDOWN))) {
            long remainingSeconds = Duration.between(now, existing.createdAt.plus(RESEND_COOLDOWN)).toSeconds();
            throw new BusinessRuleException("Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting a new OTP.");
        }

        // Generate cryptographically random 6-digit numeric OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String otpString = String.valueOf(code);

        otpStore.put(normalizedEmail, new OtpRecord(otpString, now.plus(OTP_TTL), now));
        
        // Strictly log without revealing sensitive OTP digits
        log.info("Secure password reset OTP generated successfully for masked account: {}", maskEmail(normalizedEmail));
        return otpString;
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String normalizedEmail = email.toLowerCase().trim();
        Instant now = Instant.now();

        OtpRecord record = otpStore.get(normalizedEmail);
        if (record == null) {
            return false;
        }

        if (now.isAfter(record.expiresAt)) {
            otpStore.remove(normalizedEmail);
            return false;
        }

        record.attempts++;
        if (record.attempts > MAX_ATTEMPTS) {
            otpStore.remove(normalizedEmail);
            log.warn("Exceeded maximum OTP verification attempts for account: {}", maskEmail(normalizedEmail));
            return false;
        }

        if (record.otp.equals(otp.trim())) {
            otpStore.remove(normalizedEmail);
            log.info("OTP verified successfully for account: {}", maskEmail(normalizedEmail));
            return true;
        }

        return false;
    }

    @Override
    public String createResetToken(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        String token = UUID.randomUUID().toString();
        resetTokenStore.put(normalizedEmail, new ResetTokenRecord(token, Instant.now().plus(RESET_TOKEN_TTL)));
        return token;
    }

    @Override
    public boolean validateResetToken(String email, String resetToken) {
        if (resetToken == null || resetToken.isBlank()) {
            return false;
        }
        String normalizedEmail = email.toLowerCase().trim();
        ResetTokenRecord record = resetTokenStore.get(normalizedEmail);
        if (record == null) {
            return false;
        }
        if (Instant.now().isAfter(record.expiresAt)) {
            resetTokenStore.remove(normalizedEmail);
            return false;
        }
        return record.token.equals(resetToken.trim());
    }

    @Override
    public void clearOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        otpStore.remove(normalizedEmail);
        resetTokenStore.remove(normalizedEmail);
    }

    @Override
    public String getActiveOtpForTesting(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        OtpRecord record = otpStore.get(normalizedEmail);
        return record != null ? record.otp : null;
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
}
