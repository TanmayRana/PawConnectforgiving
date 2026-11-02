package com.example.PawConnect.service;

public interface EmailService {

    /**
     * Dispatches an email notification.
     *
     * @param to recipient email address
     * @param subject subject line
     * @param body email body content
     * @return true if successfully dispatched or acknowledged by adapter
     */
    boolean sendEmail(String to, String subject, String body);
}
