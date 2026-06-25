require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
};
if (process.env.DB_PASSWORD) {
  dbConfig.password = process.env.DB_PASSWORD;
}
const dbName = process.env.DB_NAME || "library_db";

async function runMigrations() {
  let connection;

  try {
    // Connect without database first to create it
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`📦 Database '${dbName}' ready`);

    await connection.changeUser({ database: dbName });
    console.log("🔄 Running migrations...");

    const migrationsDir = path.join(__dirname, "../../migrations");
    const migrationFiles = [
      "001_initial_schema.sql",
      "002_alter_users_student_id.sql",
      "003_book_requests.sql",
    ];

    for (const file of migrationFiles) {
      const migrationFile = path.join(migrationsDir, file);
      if (!fs.existsSync(migrationFile)) continue;
      const sql = fs.readFileSync(migrationFile, "utf8");
      await connection.query(sql);
      console.log(`   ✓ ${file}`);
    }
    console.log("✅ Migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigrations();
