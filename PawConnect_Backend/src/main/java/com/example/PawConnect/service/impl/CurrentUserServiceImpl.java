package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.exception.UnauthorizedException;
import com.example.PawConnect.mapper.UserMapper;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import com.example.PawConnect.security.UserDetailsImpl;
import com.example.PawConnect.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CurrentUserServiceImpl implements CurrentUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        String email = getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found with email: " + email));
    }

    @Override
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails.getId();
        }
        return getCurrentUser().getId();
    }

    @Override
    public String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return auth.getName();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserResponse() {
        User user = getCurrentUser();
        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(user.getId());
        List<String> roleCodes = userRoles.stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleCode())
                .collect(Collectors.toList());

        return userMapper.toUserResponse(user, roleCodes);
    }

    @Override
    public boolean isCurrentUser(Long userId) {
        if (userId == null) {
            return false;
        }
        try {
            Long currentId = getCurrentUserId();
            return userId.equals(currentId);
        } catch (UnauthorizedException e) {
            return false;
        }
    }

    @Override
    public void requireCurrentUser(Long userId) {
        if (!isCurrentUser(userId) && !hasRole("ADMIN")) {
            throw new ForbiddenException("Access denied: you do not have permission to access this user's data");
        }
    }

    @Override
    public boolean hasRole(String roleCode) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        String targetAuthority = roleCode.startsWith("ROLE_") ? roleCode : "ROLE_" + roleCode;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase(targetAuthority));
    }
}
