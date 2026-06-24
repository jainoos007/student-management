import * as BetterSqlite3 from "better-sqlite3";

type DatabaseConstructor = new (filename: string) => BetterSqlite3.Database;

const Database =
  (BetterSqlite3 as unknown as { default?: DatabaseConstructor }).default ??
  (BetterSqlite3 as unknown as DatabaseConstructor);
const db = new Database("database/students.db");

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Clear existing data to allow re-seeding without UNIQUE/FOREIGN KEY violations
db.exec(`
  DELETE FROM enrollments;
  DELETE FROM courses;
  DELETE FROM students;
  DELETE FROM sqlite_sequence WHERE name IN ('students', 'courses', 'enrollments');
`);

console.log("Database cleared.");

// Seed Courses
const coursesList = [
  { name: "Introduction to Computer Science", code: "CS101", credits: 4 },
  { name: "Data Structures and Algorithms", code: "CS201", credits: 4 },
  { name: "Calculus I", code: "MATH101", credits: 3 },
  { name: "Linear Algebra", code: "MATH201", credits: 3 },
  { name: "General Physics I", code: "PHYS101", credits: 4 },
  { name: "General Chemistry I", code: "CHEM101", credits: 4 },
  { name: "General Biology I", code: "BIO101", credits: 3 },
  { name: "College Composition", code: "ENG101", credits: 3 },
];

const courseStmt = db.prepare(`
  INSERT INTO courses (name, code, credits, created_at) VALUES (?, ?, ?, ?)
`);

const courseIds: number[] = [];
for (const course of coursesList) {
  const result = courseStmt.run(
    course.name,
    course.code,
    course.credits,
    new Date().toISOString()
  );
  courseIds.push(Number(result.lastInsertRowid));
}
console.log(`${coursesList.length} courses inserted!`);

// Seed Students
const studentStmt = db.prepare(`
  INSERT INTO students (name, email, age, department, created_at) VALUES (?, ?, ?, ?, ?)
`);

const departments = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
];

const studentIds: number[] = [];
for (let i = 1; i <= 50; i++) {
  const name = `Student ${i}`;
  const email = `student${i}@university.edu`;
  const age = Math.floor(Math.random() * 10) + 18;
  const department =
    departments[Math.floor(Math.random() * departments.length)];
  const createdAt = new Date().toISOString();

  const result = studentStmt.run(name, email, age, department, createdAt);
  studentIds.push(Number(result.lastInsertRowid));
}
console.log("50 students inserted!");

// Seed Enrollments
const enrollmentStmt = db.prepare(`
  INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, ?)
`);

let enrollmentCount = 0;
for (const studentId of studentIds) {
  // Enroll each student in 1 to 4 random courses
  const numCourses = Math.floor(Math.random() * 4) + 1;
  const shuffledCourses = [...courseIds].sort(() => 0.5 - Math.random());
  const chosenCourses = shuffledCourses.slice(0, numCourses);

  for (const courseId of chosenCourses) {
    const enrollmentDate = new Date().toISOString();
    enrollmentStmt.run(studentId, courseId, enrollmentDate);
    enrollmentCount++;
  }
}
console.log(`${enrollmentCount} enrollments inserted!`);
