package com.example.PawConnect.service.impl;

import com.example.PawConnect.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class DevSmsServiceImpl implements SmsService {

    @Value("${application.notification.sms.enabled:false}")
    private boolean smsEnabled;

    private final AtomicInteger sentCount = new AtomicInteger(0);
    private volatile boolean simulateFailure = false;
    private volatile String lastPhone;
    private volatile String lastMessage;

    @Override
    public boolean sendSms(String phone, String message) {
        if (!smsEnabled) {
            log.debug("SMS notification disabled by configuration; skipping SMS to {}", maskPhone(phone));
            return false;
        }

        if (simulateFailure) {
            log.warn("Simulated SMS delivery failure for recipient: {}", maskPhone(phone));
            return false;
        }

        try {
            this.lastPhone = phone;
            this.lastMessage = message;
            this.sentCount.incrementAndGet();

            log.info("Dispatched dev SMS to {}", maskPhone(phone));
            return true;
        } catch (Exception ex) {
            log.error("Failed to dispatch SMS notification: {}", ex.getMessage());
            return false;
        }
    }

    public int getSentCount() {
        return sentCount.get();
    }

    public void reset() {
        sentCount.set(0);
        simulateFailure = false;
        lastPhone = null;
        lastMessage = null;
    }

    public void setSimulateFailure(boolean simulateFailure) {
        this.simulateFailure = simulateFailure;
    }

    public void setSmsEnabled(boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
    }

    public String getLastPhone() {
        return lastPhone;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "***";
        }
        return phone.substring(0, 2) + "******" + phone.substring(phone.length() - 2);
    }
}
