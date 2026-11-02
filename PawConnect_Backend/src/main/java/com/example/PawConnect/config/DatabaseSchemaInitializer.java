package com.example.PawConnect.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Startup schema alignment to drop any obsolete unique constraints that prevent repeated checkouts,
 * ensuring seamless runtime compatibility across PostgreSQL and H2 without requiring manual DDL execution.
 */
@Slf4j
@Component
@Order(1)
public class DatabaseSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            // Drop obsolete constraint if present so customers can place multiple consecutive orders without conflict
            jdbcTemplate.execute("ALTER TABLE IF EXISTS cart DROP CONSTRAINT IF EXISTS uk_cart_user_status");
            log.info("Database schema alignment: successfully verified/dropped legacy constraint 'uk_cart_user_status'");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice: {}", ex.getMessage());
        }

        try {
            // Drop any legacy enum check constraints on orders and history tables to allow OrderStatus.PENDING and PaymentStatus.PAID
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_order_status_check");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS check_order_status");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_payment_status_check");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS check_payment_status");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS order_status_history DROP CONSTRAINT IF EXISTS order_status_history_status_check");
            log.info("Database schema alignment: successfully verified/dropped legacy order_status and payment_status check constraints");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on order_status constraints: {}", ex.getMessage());
        }

        try {
            // Synchronize legacy Payment rows into PaymentOrder if not already present
            jdbcTemplate.execute(
                "INSERT INTO payment_orders (razorpay_order_id, razorpay_payment_id, user_id, order_id, booking_id, booking_type, amount_in_paise, currency, status, signature_verified, created_at, updated_at) " +
                "SELECT p.gateway_order_id, p.gateway_payment_id, p.user_id, " +
                "CASE WHEN p.payment_for = 'ORDER' THEN p.reference_id ELSE NULL END, " +
                "CASE WHEN p.payment_for != 'ORDER' THEN p.reference_id ELSE NULL END, " +
                "CASE WHEN p.payment_for = 'APPOINTMENT' THEN 'VETERINARY' WHEN p.payment_for = 'SERVICE_BOOKING' THEN 'SERVICE_BOOKING' ELSE NULL END, " +
                "CAST(p.amount * 100 AS BIGINT), COALESCE(p.currency, 'INR'), p.status, TRUE, p.created_at, p.updated_at " +
                "FROM payments p " +
                "WHERE p.gateway_order_id IS NOT NULL " +
                "AND NOT EXISTS (SELECT 1 FROM payment_orders po WHERE po.razorpay_order_id = p.gateway_order_id)"
            );
            log.info("Database schema alignment: synced legacy payment records into payment_orders");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on payment sync: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS courier_partner VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_label_number VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS package_weight_kg NUMERIC(6, 2)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS package_dimensions VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS dispatch_notes VARCHAR(1000)");
            log.info("Database schema alignment: verified/added logistics and shipping columns to orders table");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on orders logistics columns: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(1000)");
            jdbcTemplate.execute(
                "UPDATE order_items oi SET product_image_url = (" +
                "SELECT pi.image_url FROM product_images pi " +
                "WHERE pi.product_id = oi.product_id " +
                "ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1" +
                ") WHERE oi.product_image_url IS NULL AND oi.product_id IS NOT NULL"
            );
            log.info("Database schema alignment: verified order_items.product_image_url column and backfilled snapshots");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on order_items product_image_url: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS payment_orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS service_bookings ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP");
            log.info("Database schema alignment: verified payment_expires_at columns on orders, payment_orders, appointments, and service_bookings");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on payment_expires_at: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50)");
            log.info("Database schema alignment: verified promo_code column on orders");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on orders promo_code: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS broadcast_announcements (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "title VARCHAR(255) NOT NULL, " +
                "message TEXT NOT NULL, " +
                "target_audience VARCHAR(100) NOT NULL, " +
                "dispatch_status VARCHAR(50) NOT NULL DEFAULT 'SENT', " +
                "recipient_count INT DEFAULT 0, " +
                "created_by_user_id BIGINT, " +
                "sent_at TIMESTAMP, " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")"
            );
            log.info("Database schema alignment: verified/created broadcast_announcements table");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on broadcast_announcements: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE");
            log.info("Database schema alignment: verified users.email_notifications_enabled column");
        } catch (Exception ex) {
            log.debug("Database schema alignment notice on users email_notifications_enabled: {}", ex.getMessage());
        }
    }
}
