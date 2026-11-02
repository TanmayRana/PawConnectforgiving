package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.CreateBroadcastRequest;
import com.example.PawConnect.dto.response.admin.BroadcastAnnouncementResponse;
import com.example.PawConnect.model.User;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Notifications", description = "Platform-wide broadcast announcements, fan-out dispatch, and notification logs")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Get paginated broadcast announcement history")
    public ResponseEntity<ApiResponse<PageResponse<BroadcastAnnouncementResponse>>> getBroadcasts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String audience,
            @PageableDefault(size = 20) @SortDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<BroadcastAnnouncementResponse> page = notificationService.getAllBroadcasts(pageable, search, audience);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping({"", "/broadcast"})
    @Operation(summary = "Compose and dispatch a platform broadcast announcement to targeted users")
    public ResponseEntity<ApiResponse<BroadcastAnnouncementResponse>> createBroadcast(
            @Valid @RequestBody CreateBroadcastRequest request
    ) {
        User adminUser = currentUserService.getCurrentUser();
        BroadcastAnnouncementResponse response = notificationService.createBroadcast(request, adminUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Broadcast notification dispatched successfully"));
    }

    @PostMapping("/{id}/resend")
    @Operation(summary = "Re-dispatch an existing broadcast announcement")
    public ResponseEntity<ApiResponse<BroadcastAnnouncementResponse>> resendBroadcast(@PathVariable Long id) {
        User adminUser = currentUserService.getCurrentUser();
        BroadcastAnnouncementResponse response = notificationService.resendBroadcast(id, adminUser);
        return ResponseEntity.ok(ApiResponse.ok(response, "Broadcast announcement resent successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a broadcast announcement record and its linked notifications")
    public ResponseEntity<ApiResponse<Void>> deleteBroadcast(@PathVariable Long id) {
        User adminUser = currentUserService.getCurrentUser();
        notificationService.deleteBroadcast(id, adminUser);
        return ResponseEntity.ok(ApiResponse.ok(null, "Broadcast announcement deleted successfully"));
    }
}
