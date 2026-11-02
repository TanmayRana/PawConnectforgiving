package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.user.ChangePasswordRequest;
import com.example.PawConnect.dto.request.user.UpdateProfileRequest;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.DuplicateResourceException;
import com.example.PawConnect.mapper.UserMapper;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = currentUserService.getCurrentUser();

        String newPhone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (newPhone != null && !newPhone.isEmpty()) {
            if (!newPhone.equals(user.getPhone())) {
                if (userRepository.existsByPhoneAndIdNot(newPhone, user.getId())) {
                    throw new DuplicateResourceException("Phone number is already registered to another account");
                }
                user.setPhone(newPhone);
            }
        } else if (request.getPhone() != null) {
            user.setPhone(null);
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage().trim());
        }
        if (request.getEmailNotificationsEnabled() != null) {
            user.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        }

        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUserService.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BusinessRuleException("New password and confirmation password do not match");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BusinessRuleException("New password cannot be the same as the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        // Invalidate active JWT sessions via token version bump
        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);
    }
}
