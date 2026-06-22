import * as BetterSqlite3 from "better-sqlite3";

type DatabaseConstructor = new (filename: string) => BetterSqlite3.Database;

const Database =
  (BetterSqlite3 as unknown as { default?: DatabaseConstructor }).default ??
  (BetterSqlite3 as unknown as DatabaseConstructor);
const db = new Database("database/students.db");

const stmt = db.prepare(`
  INSERT INTO students (name, email, age, department, created_at) VALUES (?, ?, ?, ?, ?)`);

const departments = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
];

for (let i = 1; i <= 50; i++) {
  const name = `Student ${i}`;
  const email = `student${i}@university.edu`;
  const age = Math.floor(Math.random() * 10) + 18;
  const department =
    departments[Math.floor(Math.random() * departments.length)];
  const createdAt = new Date().toISOString();

  stmt.run(name, email, age, department, createdAt);
}

console.log("50 students inserted!");
