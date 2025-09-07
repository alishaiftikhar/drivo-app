-- Drivo Database Setup Script - FINAL VERSION
-- This script creates all tables with consistent data types and proper constraints
-- First, drop all existing tables (this will delete all data)
DROP TABLE IF EXISTS drivo_earning;
DROP TABLE IF EXISTS drivo_cancellation;
DROP TABLE IF EXISTS drivo_pushnotificationtoken;
DROP TABLE IF EXISTS drivo_notificationpreference;
DROP TABLE IF EXISTS drivo_emailotp;
DROP TABLE IF EXISTS drivo_review;
DROP TABLE IF EXISTS drivo_payment;
DROP TABLE IF EXISTS drivo_ride;
DROP TABLE IF EXISTS drivo_ride_request;
DROP TABLE IF EXISTS drivo_driverprofile;
DROP TABLE IF EXISTS drivo_clientprofile;
DROP TABLE IF EXISTS drivo_user;

-- Create tables with consistent data types
CREATE TABLE drivo_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(254) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_driver BOOLEAN DEFAULT FALSE,
    is_client BOOLEAN DEFAULT FALSE
);

CREATE TABLE drivo_clientprofile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(100) NULL,
    cnic VARCHAR(15) NULL,
    age INT NULL,
    phone_number VARCHAR(15) NULL,
    address VARCHAR(255) NULL,
    latitude DECIMAL(9,6) NULL,
    longitude DECIMAL(9,6) NULL,
    dp VARCHAR(255) NULL,
    last_location_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES drivo_user(id) ON DELETE CASCADE
);

CREATE TABLE drivo_driverprofile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(100) NULL,
    cnic VARCHAR(15) NULL,
    age INT NULL,
    driving_license VARCHAR(50) NULL,
    license_expiry DATE NULL,
    phone_number VARCHAR(15) NULL,
    city VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    dp VARCHAR(255) NULL,
    current_latitude DECIMAL(9,6) NULL,
    current_longitude DECIMAL(9,6) NULL,
    last_location_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES drivo_user(id) ON DELETE CASCADE,
    -- Add constraints for status field
    CHECK (status IN ('pending', 'approved', 'rejected', 'available', 'busy', 'offline'))
);

CREATE TABLE drivo_ride_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    pickup_latitude DECIMAL(10, 6),
    pickup_longitude DECIMAL(10, 6),
    dropoff_latitude DECIMAL(10, 6),
    dropoff_longitude DECIMAL(10, 6),
    scheduled_datetime TIMESTAMP NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'car',
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'petrol',
    trip_type VARCHAR(50) NOT NULL DEFAULT 'one_way',
    estimated_fare DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES drivo_clientprofile(id) ON DELETE CASCADE,
    -- Add constraints for enum-like fields
    CHECK (fuel_type IN ('petrol', 'cng', 'diesel')),
    CHECK (trip_type IN ('one_way', 'two_way', 'round_trip')),
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    CHECK (vehicle_type IN ('car', 'bike', 'van', 'truck', 'suv'))
);

CREATE TABLE drivo_ride (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NULL,
    client_id BIGINT NOT NULL,
    driver_id BIGINT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    pickup_latitude DECIMAL(12,8) NULL,
    pickup_longitude DECIMAL(12,8) NULL,
    dropoff_latitude DECIMAL(12,8) NULL,
    dropoff_longitude DECIMAL(12,8) NULL,
    scheduled_datetime TIMESTAMP NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'car',
    fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol',
    trip_type VARCHAR(20) NOT NULL DEFAULT 'one_way',
    fare DECIMAL(10,2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES drivo_ride_request(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES drivo_clientprofile(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivo_driverprofile(id) ON DELETE SET NULL,
    -- Add constraints
    CHECK (fuel_type IN ('petrol', 'cng', 'diesel')),
    CHECK (trip_type IN ('one_way', 'two_way', 'round_trip')),
    CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
    CHECK (vehicle_type IN ('car', 'bike', 'van', 'truck', 'suv'))
);

CREATE TABLE drivo_payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES drivo_ride(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES drivo_clientprofile(id) ON DELETE CASCADE,
    CHECK (method IN ('cash', 'card', 'wallet', 'bank_transfer')),
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

CREATE TABLE drivo_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NULL,
    client_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES drivo_ride(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES drivo_clientprofile(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivo_driverprofile(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ride_review (ride_id, client_id, driver_id)
);

CREATE TABLE drivo_emailotp (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    -- Add expiry for OTP cleanup
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 5 MINUTE),
    INDEX idx_email_expiry (email, expires_at)
);

CREATE TABLE drivo_notificationpreference (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    ride_updates BOOLEAN NOT NULL DEFAULT TRUE,
    promotions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES drivo_user(id) ON DELETE CASCADE
);

CREATE TABLE drivo_pushnotificationtoken (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    device_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES drivo_user(id) ON DELETE CASCADE,
    CHECK (device_type IN ('ios', 'android', 'web', 'unknown'))
);

CREATE TABLE drivo_cancellation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    cancelled_by_id BIGINT NOT NULL,
    cancellation_reason LONGTEXT NULL,
    cancellation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES drivo_ride(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by_id) REFERENCES drivo_user(id) ON DELETE CASCADE
);

CREATE TABLE drivo_earning (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    ride_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (driver_id) REFERENCES drivo_driverprofile(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES drivo_ride(id) ON DELETE CASCADE,
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed'))
);

-- Add indexes for better performance
CREATE INDEX idx_drivo_user_email ON drivo_user(email);
CREATE INDEX idx_drivo_user_type ON drivo_user(is_driver, is_client);
CREATE INDEX idx_drivo_clientprofile_user ON drivo_clientprofile(user_id);
CREATE INDEX idx_drivo_clientprofile_location ON drivo_clientprofile(latitude, longitude);
CREATE INDEX idx_drivo_driverprofile_user ON drivo_driverprofile(user_id);
CREATE INDEX idx_drivo_driverprofile_status ON drivo_driverprofile(status);
CREATE INDEX idx_drivo_driverprofile_location ON drivo_driverprofile(current_latitude, current_longitude);
CREATE INDEX idx_drivo_driverprofile_status_location ON drivo_driverprofile(status, current_latitude, current_longitude);
CREATE INDEX idx_drivo_ride_request_client ON drivo_ride_request(client_id);
CREATE INDEX idx_drivo_ride_request_status ON drivo_ride_request(status);
CREATE INDEX idx_drivo_ride_request_created ON drivo_ride_request(created_at);
CREATE INDEX idx_drivo_ride_request ON drivo_ride(request_id);
CREATE INDEX idx_drivo_ride_client ON drivo_ride(client_id);
CREATE INDEX idx_drivo_ride_driver ON drivo_ride(driver_id);
CREATE INDEX idx_drivo_ride_status ON drivo_ride(status);
CREATE INDEX idx_drivo_ride_created ON drivo_ride(created_at);
CREATE INDEX idx_drivo_ride_status_created ON drivo_ride(status, created_at);
CREATE INDEX idx_drivo_payment_ride ON drivo_payment(ride_id);
CREATE INDEX idx_drivo_payment_client ON drivo_payment(client_id);
CREATE INDEX idx_drivo_payment_status ON drivo_payment(status);
CREATE INDEX idx_drivo_review_client ON drivo_review(client_id);
CREATE INDEX idx_drivo_review_driver ON drivo_review(driver_id);
CREATE INDEX idx_drivo_review_ride ON drivo_review(ride_id);
CREATE INDEX idx_drivo_review_rating ON drivo_review(rating);
CREATE INDEX idx_drivo_emailotp_email ON drivo_emailotp(email);
CREATE INDEX idx_drivo_emailotp_created ON drivo_emailotp(created_at);
CREATE INDEX idx_drivo_cancellation_ride ON drivo_cancellation(ride_id);
CREATE INDEX idx_drivo_earning_driver ON drivo_earning(driver_id);
CREATE INDEX idx_drivo_earning_payment_status ON drivo_earning(payment_status);