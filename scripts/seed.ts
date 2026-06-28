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
  DELETE FROM audit_logs;
  DELETE FROM sqlite_sequence WHERE name IN ('students', 'courses', 'enrollments', 'audit_logs');
`);

console.log("Database cleared.");

// Date Helpers
const NOW = new Date();

function getDateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function getRandomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

// Seed Courses (created between 25 and 20 days ago)
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

const auditStmt = db.prepare(`
  INSERT INTO audit_logs (action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?)
`);

type CourseRecord = {
  id: number;
  createdDate: Date;
};

const courses: CourseRecord[] = [];
for (const course of coursesList) {
  const createdDate = getRandomDateBetween(getDateDaysAgo(25), getDateDaysAgo(20));
  const createdDateStr = createdDate.toISOString();
  
  const result = courseStmt.run(
    course.name,
    course.code,
    course.credits,
    createdDateStr
  );
  
  const courseId = Number(result.lastInsertRowid);
  courses.push({ id: courseId, createdDate });

  // Add course audit log
  auditStmt.run(
    "CREATE_COURSE",
    "COURSE",
    courseId,
    `Created course catalog entry ${course.name} [${course.code}] worth ${course.credits} credits.`,
    createdDateStr
  );
}
console.log(`${coursesList.length} courses inserted!`);

// Seed Students (created between 15 days ago and 2 days ago)
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

type StudentRecord = {
  id: number;
  name: string;
  createdDate: Date;
};

const students: StudentRecord[] = [];
for (let i = 1; i <= 50; i++) {
  const name = `Student ${i}`;
  const email = `student${i}@university.edu`;
  const age = Math.floor(Math.random() * 10) + 18;
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  // Student creations distributed across the last 15 days
  const createdDate = getRandomDateBetween(getDateDaysAgo(15), getDateDaysAgo(2));
  const createdDateStr = createdDate.toISOString();

  const result = studentStmt.run(name, email, age, department, createdDateStr);
  const studentId = Number(result.lastInsertRowid);
  
  students.push({ id: studentId, name, createdDate });

  // Add student audit log
  auditStmt.run(
    "CREATE_STUDENT",
    "STUDENT",
    studentId,
    `Registered student ${name} (${email}) in ${department} department.`,
    createdDateStr
  );
}
console.log("50 students inserted!");

// Seed Enrollments (enrolled between their student creation date and now)
const enrollmentStmt = db.prepare(`
  INSERT INTO enrollments (student_id, course_id, enrollment_date, grade) VALUES (?, ?, ?, ?)
`);

const gradesPool = ["A", "B", "C", "D", "F", null];

let enrollmentCount = 0;
for (const student of students) {
  // Enroll each student in 1 to 4 random courses
  const numCourses = Math.floor(Math.random() * 4) + 1;
  const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
  const chosenCourses = shuffledCourses.slice(0, numCourses);

  for (const course of chosenCourses) {
    // Enrollment date must be after both student and course were created
    const startDate = student.createdDate > course.createdDate ? student.createdDate : course.createdDate;
    const enrollmentDate = getRandomDateBetween(startDate, NOW);
    const enrollmentDateStr = enrollmentDate.toISOString();

    // 80% chance of having a grade, 20% chance of being null (In Progress)
    const grade = Math.random() < 0.8 
      ? gradesPool[Math.floor(Math.random() * 5)] // A, B, C, D, F
      : null;

    const result = enrollmentStmt.run(student.id, course.id, enrollmentDateStr, grade);
    const enrollmentId = Number(result.lastInsertRowid);
    enrollmentCount++;

    // Add enrollment audit log
    const courseCode = coursesList.find((_, index) => courses[index].id === course.id)?.code || "COURSE";
    const courseName = coursesList.find((_, index) => courses[index].id === course.id)?.name || "Course";

    const gradeLogStr = grade ? `with grade "${grade}"` : "(in progress)";
    auditStmt.run(
      "ENROLL_STUDENT",
      "ENROLLMENT",
      enrollmentId,
      `Enrolled student ${student.name} in course ${courseName} [${courseCode}] ${gradeLogStr}.`,
      enrollmentDateStr
    );
  }
}
console.log(`${enrollmentCount} enrollments inserted!`);
