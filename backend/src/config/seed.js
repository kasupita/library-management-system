require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'library_db',
    multipleStatements: true,
  };
  if (process.env.DB_PASSWORD) connConfig.password = process.env.DB_PASSWORD;
  const connection = await mysql.createConnection(connConfig);

  try {
    console.log('🌱 Seeding database...');

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE borrow_records');
    await connection.query('TRUNCATE TABLE donations');
    await connection.query('TRUNCATE TABLE books');
    await connection.query('TRUNCATE TABLE categories');
    await connection.query('TRUNCATE TABLE user_roles');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert users (emails match frontend Login demo accounts)
    const users = [
      { id: uuidv4(), name: 'Admin User', email: 'admin@library.edu', role: 'admin', department: 'Administration' },
      { id: uuidv4(), name: 'Jane Librarian', email: 'jane@library.edu', role: 'librarian', department: 'Library' },
      { id: uuidv4(), name: 'Dr. Smith', email: 'drsmith@university.edu', role: 'hod', department: 'Computer Science' },
      { id: uuidv4(), name: 'Alex Student', email: 'alex@student.edu', role: 'student', department: 'Engineering' },
    ];

    for (const user of users) {
      await connection.query(
        'INSERT INTO users (id, name, email, password, department, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [user.id, user.name, user.email, hashedPassword, user.department]
      );
      await connection.query(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [uuidv4(), user.id, user.role]
      );
    }

    // Insert categories (match frontend seedData)
    const categories = [
      { id: uuidv4(), name: 'Fiction', description: 'Novels, short stories, and literary works', color: '#8B5CF6' },
      { id: uuidv4(), name: 'Non-Fiction', description: 'Biographies, essays, and factual works', color: '#3B82F6' },
      { id: uuidv4(), name: 'Science & Technology', description: 'Scientific research and technical books', color: '#10B981' },
      { id: uuidv4(), name: 'History', description: 'Historical accounts and analysis', color: '#F59E0B' },
      { id: uuidv4(), name: 'Philosophy', description: 'Philosophical texts and discussions', color: '#EC4899' },
      { id: uuidv4(), name: 'Reference', description: 'Dictionaries, encyclopedias, and guides', color: '#6366F1' },
    ];

    for (const cat of categories) {
      await connection.query(
        'INSERT INTO categories (id, name, description, color, book_count, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
        [cat.id, cat.name, cat.description, cat.color]
      );
    }

    // Insert books (match frontend seedData style)
    const books = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', categoryIndex: 0, copies: 5, available: 3 },
      { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '978-0062316097', categoryIndex: 1, copies: 3, available: 2 },
      { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', categoryIndex: 2, copies: 4, available: 4 },
      { title: 'The Art of War', author: 'Sun Tzu', isbn: '978-1590302255', categoryIndex: 3, copies: 6, available: 5 },
      { title: 'Meditations', author: 'Marcus Aurelius', isbn: '978-0140449334', categoryIndex: 4, copies: 3, available: 2 },
      { title: '1984', author: 'George Orwell', isbn: '978-0451524935', categoryIndex: 0, copies: 8, available: 6 },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', categoryIndex: 2, copies: 4, available: 1 },
      { title: 'The Republic', author: 'Plato', isbn: '978-0140455113', categoryIndex: 4, copies: 2, available: 2 },
    ];

    for (const book of books) {
      await connection.query(`
        INSERT INTO books (id, title, author, isbn, category_id, copies, available_copies, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [uuidv4(), book.title, book.author, book.isbn, categories[book.categoryIndex].id, book.copies, book.available]);

      // Update category book count
      await connection.query(
        'UPDATE categories SET book_count = book_count + 1 WHERE id = ?',
        [categories[book.categoryIndex].id]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('   Admin:     admin@library.edu / password123');
    console.log('   Librarian: jane@library.edu / password123');
    console.log('   HOD:       drsmith@university.edu / password123');
    console.log('   Student:   alex@student.edu / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
