import { getDb } from "@/lib/db";

const db = getDb();

// Students
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

// Courses
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL,
    created_at TEXT NOT NULL
    )
    `);

// Enrollments
db.exec(`
  CREATE TABLE IF NOT EXISTS enrollments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date TEXT NOT NULL,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    UNIQUE(student_id, course_id)
  )
  `);

console.log("Database initialized successfully.");
