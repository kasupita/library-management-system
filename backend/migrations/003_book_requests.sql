-- Student borrow / reserve requests (librarian approves)
CREATE TABLE IF NOT EXISTS book_requests (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    request_type ENUM('borrow', 'reserve') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    processed_by VARCHAR(36) NULL,
    borrow_record_id VARCHAR(36) NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (borrow_record_id) REFERENCES borrow_records(id) ON DELETE SET NULL
);

CREATE INDEX idx_book_requests_status ON book_requests(status);
CREATE INDEX idx_book_requests_user ON book_requests(user_id);
