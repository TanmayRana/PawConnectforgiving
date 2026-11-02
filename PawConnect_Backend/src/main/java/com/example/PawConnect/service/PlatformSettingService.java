package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.PlatformSettingRequest;
import com.example.PawConnect.dto.response.admin.PlatformSettingResponse;

import java.util.List;

public interface PlatformSettingService {

    List<PlatformSettingResponse> getAllSettings();

    PlatformSettingResponse getSettingByKey(String key);

    PlatformSettingResponse updateSetting(String key, PlatformSettingRequest request);
}
