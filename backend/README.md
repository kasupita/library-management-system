# Library Hub - Backend

Express.js backend with MySQL for the Library Management System.

## Prerequisites

- Node.js 18+
- MySQL 8+ (or MariaDB)

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your MySQL credentials:
   - `DB_HOST` - MySQL host (default: localhost)
   - `DB_PORT` - MySQL port (default: 3306)
   - `DB_USER` - MySQL username (default: root)
   - `DB_PASSWORD` - Your MySQL password
   - `DB_NAME` - Database name (default: library_db)
   - `JWT_SECRET` - Secret key for JWT (use a random string in production)

3. **Run migrations** (creates database and tables)
   ```bash
   npm run migrate
   ```

4. **Seed sample data** (optional)
   ```bash
   npm run seed
   ```
   Demo login: `admin@library.com` / `password123`

5. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs at http://localhost:3001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/books | List all books |
| POST | /api/books | Create book (multipart/form-data) |
| GET | /api/books/:id | Get book by ID |
| PUT | /api/books/:id | Update book |
| DELETE | /api/books/:id | Delete book |
| GET | /api/categories | List categories |
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |

## Connecting Frontend

The frontend expects the API at `http://localhost:3001/api`. Ensure the frontend runs on port 5173 (Vite default) or update `CORS_ORIGIN` in `.env`.
