package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.model.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user, List<String> roles) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(roles != null ? roles : Collections.emptyList())
                .profileImage(user.getProfileImage())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .emailNotificationsEnabled(user.getEmailNotificationsEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        List<String> roles = Collections.emptyList();
        if (user.getUserRoles() != null) {
            roles = user.getUserRoles().stream()
                    .filter(ur -> ur.getRole() != null)
                    .map(ur -> ur.getRole().getRoleCode())
                    .collect(Collectors.toList());
        }
        return toUserResponse(user, roles);
    }
}
