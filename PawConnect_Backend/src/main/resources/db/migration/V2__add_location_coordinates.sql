-- Migration: Add geographical coordinates (latitude & longitude) for Delivery Addresses, Orders, and Veterinarian Clinics
-- Safe & Idempotent (IF NOT EXISTS)

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(10, 7);

ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC(10, 7);
ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC(10, 7);

ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
