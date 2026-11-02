package com.example.PawConnect.service;

public interface SmsService {

    /**
     * Dispatches an SMS notification.
     *
     * @param phone recipient phone number
     * @param message text message content
     * @return true if successfully dispatched or acknowledged by adapter
     */
    boolean sendSms(String phone, String message);
}
