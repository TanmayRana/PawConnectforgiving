package com.example.PawConnect.service.impl;

import com.example.PawConnect.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class DevEmailServiceImpl implements EmailService {

    @Value("${application.notification.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${application.notification.email.from:${spring.mail.username:no-reply@pawconnect.care}}")
    private String fromEmail;

    @Value("${application.notification.email.from-name:PawConnect}")
    private String fromName;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final AtomicInteger sentCount = new AtomicInteger(0);
    private volatile boolean simulateFailure = false;
    private volatile String lastRecipient;
    private volatile String lastSubject;
    private volatile String lastBody;

    @Override
    public boolean sendEmail(String to, String subject, String body) {
        if (!emailEnabled) {
            log.debug("Email notification disabled by configuration; skipping email to {}", maskEmail(to));
            return false;
        }

        if (simulateFailure) {
            log.warn("Simulated email delivery failure for recipient: {}", maskEmail(to));
            return false;
        }

        try {
            this.lastRecipient = to;
            this.lastSubject = subject;
            this.lastBody = body;
            this.sentCount.incrementAndGet();

            if (mailSender != null) {
                String displayName = (fromName != null && !fromName.isBlank()) ? fromName : "PawConnect";

                if (isHtmlContent(body)) {
                    MimeMessage mimeMessage = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(
                            mimeMessage,
                            MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                            StandardCharsets.UTF_8.name()
                    );

                    if (fromEmail != null && !fromEmail.isBlank()) {
                        try {
                            helper.setFrom(fromEmail, displayName);
                        } catch (Exception e) {
                            helper.setFrom(fromEmail);
                        }
                    }
                    helper.setTo(to);
                    helper.setSubject(subject);
                    String plainText = stripHtmlToPlainText(body);
                    helper.setText(plainText, body);
                    mailSender.send(mimeMessage);
                    log.info("Successfully sent real HTML SMTP email to {} via JavaMailSender with subject: {}", maskEmail(to), subject);
                } else {
                    SimpleMailMessage message = new SimpleMailMessage();
                    if (fromEmail != null && !fromEmail.isBlank()) {
                        message.setFrom(displayName + " <" + fromEmail + ">");
                    }
                    message.setTo(to);
                    message.setSubject(subject);
                    message.setText(body);
                    mailSender.send(message);
                    log.info("Successfully sent real text SMTP email to {} via JavaMailSender with subject: {}", maskEmail(to), subject);
                }
            } else {
                log.info("Dispatched dev email in-memory to {} with subject: {}", maskEmail(to), subject);
            }

            return true;
        } catch (Exception ex) {
            log.error("Failed to dispatch email notification to {}: {}", maskEmail(to), ex.getMessage(), ex);
            return false;
        }
    }

    private boolean isHtmlContent(String content) {
        if (content == null) {
            return false;
        }
        String trimmed = content.trim().toLowerCase();
        return trimmed.startsWith("<!doctype html")
                || trimmed.startsWith("<html")
                || trimmed.contains("<div")
                || trimmed.contains("<table")
                || trimmed.contains("<body");
    }

    private String stripHtmlToPlainText(String html) {
        if (html == null) {
            return "";
        }
        return html.replaceAll("<!--[\\s\\S]*?-->", " ")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public int getSentCount() {
        return sentCount.get();
    }

    public void reset() {
        sentCount.set(0);
        simulateFailure = false;
        lastRecipient = null;
        lastSubject = null;
        lastBody = null;
    }

    public void setSimulateFailure(boolean simulateFailure) {
        this.simulateFailure = simulateFailure;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public String getLastRecipient() {
        return lastRecipient;
    }

    public String getLastSubject() {
        return lastSubject;
    }

    public String getLastBody() {
        return lastBody;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        String name = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (name.length() <= 2) {
            return name + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }
}
