package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.user.ChangePasswordRequest;
import com.example.PawConnect.dto.request.user.UpdateProfileRequest;
import com.example.PawConnect.dto.response.UserResponse;

public interface UserService {

    UserResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);
}
