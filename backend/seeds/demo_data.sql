-- Demo data for Library Management System
-- Run after migrations to populate sample data

-- Insert demo users (passwords are hashed 'password123')
INSERT INTO users (id, name, email, password, department, created_at) VALUES
('user-admin-001', 'Admin User', 'admin@library.com', '$2a$10$rQnM1.RpGmGNhPpxHxVkCO8zDe7Z0qjQqJ7qJ0PxXpXpXpXpXpXpX', 'Administration', NOW()),
('user-librarian-001', 'Sarah Johnson', 'librarian@library.com', '$2a$10$rQnM1.RpGmGNhPpxHxVkCO8zDe7Z0qjQqJ7qJ0PxXpXpXpXpXpXpX', 'Library', NOW()),
('user-hod-001', 'Dr. Michael Chen', 'hod@library.com', '$2a$10$rQnM1.RpGmGNhPpxHxVkCO8zDe7Z0qjQqJ7qJ0PxXpXpXpXpXpXpX', 'Computer Science', NOW()),
('user-student-001', 'Emily Davis', 'student@library.com', '$2a$10$rQnM1.RpGmGNhPpxHxVkCO8zDe7Z0qjQqJ7qJ0PxXpXpXpXpXpXpX', 'Computer Science', NOW());

-- Assign roles
INSERT INTO user_roles (id, user_id, role) VALUES
('role-001', 'user-admin-001', 'admin'),
('role-002', 'user-librarian-001', 'librarian'),
('role-003', 'user-hod-001', 'hod'),
('role-004', 'user-student-001', 'student');

-- Insert categories
INSERT INTO categories (id, name, description, color, book_count, created_at) VALUES
('cat-001', 'Computer Science', 'Programming, algorithms, and software development', '#3B82F6', 3, NOW()),
('cat-002', 'Mathematics', 'Pure and applied mathematics', '#10B981', 2, NOW()),
('cat-003', 'Literature', 'Classic and contemporary literature', '#8B5CF6', 2, NOW()),
('cat-004', 'Science', 'Physics, chemistry, and biology', '#F59E0B', 1, NOW());

-- Insert books
INSERT INTO books (id, title, author, isbn, category_id, description, published_year, publisher, copies, available_copies, is_donated, created_at, updated_at) VALUES
('book-001', 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'cat-001', 'Comprehensive textbook on algorithms', 2009, 'MIT Press', 5, 3, FALSE, NOW(), NOW()),
('book-002', 'Clean Code', 'Robert C. Martin', '978-0132350884', 'cat-001', 'A handbook of agile software craftsmanship', 2008, 'Prentice Hall', 3, 2, FALSE, NOW(), NOW()),
('book-003', 'Design Patterns', 'Gang of Four', '978-0201633610', 'cat-001', 'Elements of reusable object-oriented software', 1994, 'Addison-Wesley', 2, 1, TRUE, NOW(), NOW()),
('book-004', 'Calculus', 'James Stewart', '978-1285740621', 'cat-002', 'Early transcendentals', 2015, 'Cengage Learning', 4, 4, FALSE, NOW(), NOW()),
('book-005', 'Linear Algebra Done Right', 'Sheldon Axler', '978-3319110790', 'cat-002', 'Undergraduate linear algebra', 2014, 'Springer', 2, 2, FALSE, NOW(), NOW()),
('book-006', 'Pride and Prejudice', 'Jane Austen', '978-0141439518', 'cat-003', 'Classic romantic novel', 1813, 'Penguin Classics', 3, 3, FALSE, NOW(), NOW()),
('book-007', '1984', 'George Orwell', '978-0451524935', 'cat-003', 'Dystopian social science fiction', 1949, 'Signet Classic', 4, 3, FALSE, NOW(), NOW()),
('book-008', 'A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'cat-004', 'Popular science book on cosmology', 1988, 'Bantam Books', 2, 1, TRUE, NOW(), NOW());

-- Insert donations
INSERT INTO donations (id, book_id, donor_name, donor_email, donor_phone, quantity, notes, status, created_at) VALUES
('don-001', 'book-003', 'John Smith', 'john.smith@email.com', '555-0101', 2, 'Gently used copies', 'accepted', NOW()),
('don-002', 'book-008', 'Mary Johnson', 'mary.j@email.com', '555-0102', 2, 'New condition', 'accepted', NOW()),
('don-003', NULL, 'Robert Brown', 'rbrown@email.com', NULL, 5, 'Collection of programming books', 'pending', NOW());

-- Insert borrow records
INSERT INTO borrow_records (id, book_id, user_id, borrow_date, due_date, status) VALUES
('borrow-001', 'book-001', 'user-student-001', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 'borrowed'),
('borrow-002', 'book-002', 'user-student-001', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), 'borrowed'),
('borrow-003', 'book-007', 'user-hod-001', DATE_SUB(NOW(), INTERVAL 14 DAY), NOW(), 'borrowed'),
('borrow-004', 'book-008', 'user-student-001', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 'borrowed');
