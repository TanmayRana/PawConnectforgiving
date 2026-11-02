package com.example.PawConnect.service.impl;

import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.ServiceBooking;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.AppointmentRepository;
import com.example.PawConnect.repository.ServiceBookingRepository;
import com.example.PawConnect.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledReminderService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final NotificationService notificationService;
    private final com.example.PawConnect.service.OrderService orderService;

    /**
     * Executes scheduled reminder sweep for upcoming confirmed bookings occurring tomorrow.
     * Idempotent and safe to retry: uses deterministic deduplication keys.
     *
     * @return count of reminder notifications successfully initiated
     */
    @Scheduled(cron = "${application.scheduling.reminders.cron:0 0 8 * * *}")
    @Transactional
    public int sendUpcomingReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int totalReminders = 0;

        // 1. Process upcoming confirmed veterinary appointments
        List<Appointment> upcomingAppointments = appointmentRepository.findByAppointmentDateAndStatus(
                tomorrow,
                AppointmentStatus.CONFIRMED
        );

        for (Appointment apt : upcomingAppointments) {
            try {
                User owner = apt.getPet() != null ? apt.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = String.format("REMINDER-APT-%d-%s", apt.getId(), tomorrow);
                    String petName = apt.getPet() != null ? apt.getPet().getName() : "your pet";
                    notificationService.createNotification(
                            owner,
                            NotificationType.APPOINTMENT_REMINDER,
                            "Upcoming Appointment Reminder",
                            String.format("Reminder: You have a confirmed appointment for %s tomorrow (%s) at %s.",
                                    petName, tomorrow, apt.getStartTime()),
                            "APPOINTMENT",
                            apt.getId(),
                            dedupeKey
                    );
                    totalReminders++;
                }
            } catch (Exception ex) {
                log.error("Failed to process appointment reminder for id {}: {}", apt.getId(), ex.getMessage());
            }
        }

        // 2. Process upcoming confirmed service bookings
        List<ServiceBooking> upcomingServiceBookings = serviceBookingRepository.findByBookingDateAndStatus(
                tomorrow,
                BookingStatus.CONFIRMED
        );

        for (ServiceBooking sb : upcomingServiceBookings) {
            try {
                User owner = sb.getPet() != null ? sb.getPet().getOwner() : null;
                if (owner != null) {
                    String dedupeKey = String.format("REMINDER-SB-%d-%s", sb.getId(), tomorrow);
                    String serviceName = sb.getService() != null ? sb.getService().getName() : "service";
                    notificationService.createNotification(
                            owner,
                            NotificationType.BOOKING_REMINDER,
                            "Upcoming Service Booking Reminder",
                            String.format("Reminder: You have a confirmed booking for %s tomorrow (%s) at %s.",
                                    serviceName, tomorrow, sb.getStartTime()),
                            "SERVICE_BOOKING",
                            sb.getId(),
                            dedupeKey
                    );
                    totalReminders++;
                }
            } catch (Exception ex) {
                log.error("Failed to process service booking reminder for id {}: {}", sb.getId(), ex.getMessage());
            }
        }

        log.info("Completed scheduled reminder sweep for date {}: processed {} eligible bookings", tomorrow, totalReminders);
        return totalReminders;
    }

    /**
     * Automated Background Expiry Job: runs every 60 seconds.
     * Sweeps and expires all online orders and bookings where the 15-minute payment window has elapsed.
     * Atomically restores product stock and sends customer expiry notification.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void expireOverduePaymentsSweep() {
        try {
            orderService.expireOverduePendingOrders();
        } catch (Exception ex) {
            log.error("Error executing overdue pending orders expiry sweep: {}", ex.getMessage());
        }

        try {
            java.time.Instant now = java.time.Instant.now();
            List<Appointment> overdueAppointments = appointmentRepository.findByStatusAndPaymentExpiresAtBefore(
                    AppointmentStatus.PENDING, now
            );
            for (Appointment apt : overdueAppointments) {
                apt.setStatus(AppointmentStatus.CANCELLED);
                appointmentRepository.save(apt);
                log.info("Expired unpaid appointment {} after 15-minute payment window", apt.getAppointmentNo());
            }
        } catch (Exception ex) {
            log.error("Error expiring overdue pending appointments: {}", ex.getMessage());
        }

        try {
            java.time.Instant now = java.time.Instant.now();
            List<ServiceBooking> overdueBookings = serviceBookingRepository.findByStatusAndPaymentExpiresAtBefore(
                    BookingStatus.PENDING, now
            );
            for (ServiceBooking sb : overdueBookings) {
                sb.setStatus(BookingStatus.CANCELLED);
                serviceBookingRepository.save(sb);
                log.info("Expired unpaid service booking {} after 15-minute payment window", sb.getBookingNo());
            }
        } catch (Exception ex) {
            log.error("Error expiring overdue pending service bookings: {}", ex.getMessage());
        }
    }
}
