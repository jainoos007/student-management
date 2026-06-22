import db from "@/lib/db";

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    age INTEGER NOT NULL,
    department TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `);

console.log("Database initialized successfully.");
