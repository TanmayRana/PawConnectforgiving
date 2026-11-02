package com.example.PawConnect.service;

import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.model.User;

public interface CurrentUserService {

    User getCurrentUser();

    Long getCurrentUserId();

    String getCurrentUserEmail();

    UserResponse getCurrentUserResponse();

    boolean isCurrentUser(Long userId);

    void requireCurrentUser(Long userId);

    boolean hasRole(String roleCode);
}
