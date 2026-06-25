-- Library Management System - MySQL Schema
-- Run this file to set up the database tables

-- Create app_role enum equivalent (MySQL doesn't have enums like PostgreSQL)
-- We'll use VARCHAR with CHECK constraints or ENUM type

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- SIBA Student ID / index number (e.g. bscwd234008). Nullable for non-students.
    student_id VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles table (separate table for security - prevents privilege escalation)
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'librarian', 'hod', 'student') NOT NULL,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT '#3B82F6',
    book_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    category_id VARCHAR(36),
    description TEXT,
    published_year INT,
    publisher VARCHAR(255),
    copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    cover_image VARCHAR(500),
    digital_file VARCHAR(500),
    is_donated BOOLEAN DEFAULT FALSE,
    donor_name VARCHAR(255),
    donor_contact VARCHAR(255),
    donation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36),
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(50),
    donor_address TEXT,
    quantity INT DEFAULT 1,
    notes TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    processed_by VARCHAR(36),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Borrow records table (DATETIME for MySQL 8 compatibility)
CREATE TABLE IF NOT EXISTS borrow_records (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME NULL DEFAULT NULL,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    fine DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventory removal log (tracks removed books)
CREATE TABLE IF NOT EXISTS inventory_removals (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36) NULL,
    book_title VARCHAR(500) NOT NULL,
    removed_by VARCHAR(36) NOT NULL,
    reason TEXT,
    removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Past exam papers (PDF uploads)
CREATE TABLE IF NOT EXISTS exam_papers (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    course VARCHAR(255),
    year INT,
    semester VARCHAR(50),
    file_path VARCHAR(500) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    uploaded_by VARCHAR(36) NOT NULL,
    approved_by VARCHAR(36),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notification events to prevent duplicate emails
CREATE TABLE IF NOT EXISTS notification_events (
    id VARCHAR(36) PRIMARY KEY,
    borrow_id VARCHAR(36) NOT NULL,
    event_type ENUM('due_soon', 'overdue') NOT NULL,
    event_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_borrow_event (borrow_id, event_type, event_date),
    FOREIGN KEY (borrow_id) REFERENCES borrow_records(id) ON DELETE CASCADE
);

-- Indexes for better performance
SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'books' AND index_name = 'idx_books_category'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_books_category ON books(category_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'books' AND index_name = 'idx_books_title'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_books_title ON books(title)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'borrow_records' AND index_name = 'idx_borrow_status'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_borrow_status ON borrow_records(status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'borrow_records' AND index_name = 'idx_borrow_user'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_borrow_user ON borrow_records(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'donations' AND index_name = 'idx_donations_status'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_donations_status ON donations(status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'user_roles' AND index_name = 'idx_user_roles_user'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_user_roles_user ON user_roles(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'inventory_removals' AND index_name = 'idx_inventory_removed_at'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_inventory_removed_at ON inventory_removals(removed_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'exam_papers' AND index_name = 'idx_exam_papers_approved'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_exam_papers_approved ON exam_papers(is_approved)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'exam_papers' AND index_name = 'idx_exam_papers_year'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_exam_papers_year ON exam_papers(year)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
