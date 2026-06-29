import { getDb, getRawDb } from "../lib/db";
import { students, courses, enrollments, auditLogs } from "../lib/db/schema";

const db = getDb();
const rawDb = getRawDb();

// Enable foreign keys
rawDb.exec("PRAGMA foreign_keys = ON;");

// Clear existing data to allow re-seeding without UNIQUE/FOREIGN KEY violations
rawDb.exec(`
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

type CourseRecord = {
  id: number;
  createdDate: Date;
};

const coursesInserted: CourseRecord[] = [];
for (const course of coursesList) {
  const createdDate = getRandomDateBetween(getDateDaysAgo(25), getDateDaysAgo(20));
  const createdDateStr = createdDate.toISOString();
  
  const result = db.insert(courses).values({
    name: course.name,
    code: course.code,
    credits: course.credits,
    created_at: createdDateStr,
  }).run();
  
  const courseId = Number(result.lastInsertRowid);
  coursesInserted.push({ id: courseId, createdDate });

  // Add course audit log
  db.insert(auditLogs).values({
    action: "CREATE_COURSE",
    entity_type: "COURSE",
    entity_id: courseId,
    details: `Created course catalog entry ${course.name} [${course.code}] worth ${course.credits} credits.`,
    created_at: createdDateStr,
  }).run();
}
console.log(`${coursesList.length} courses inserted!`);

// Seed Students (created between 15 days ago and 2 days ago)
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

const studentsInserted: StudentRecord[] = [];
for (let i = 1; i <= 50; i++) {
  const name = `Student ${i}`;
  const email = `student${i}@university.edu`;
  const age = Math.floor(Math.random() * 10) + 18;
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  // Student creations distributed across the last 15 days
  const createdDate = getRandomDateBetween(getDateDaysAgo(15), getDateDaysAgo(2));
  const createdDateStr = createdDate.toISOString();

  const result = db.insert(students).values({
    name,
    email,
    age,
    department,
    created_at: createdDateStr,
  }).run();
  const studentId = Number(result.lastInsertRowid);
  
  studentsInserted.push({ id: studentId, name, createdDate });

  // Add student audit log
  db.insert(auditLogs).values({
    action: "CREATE_STUDENT",
    entity_type: "STUDENT",
    entity_id: studentId,
    details: `Registered student ${name} (${email}) in ${department} department.`,
    created_at: createdDateStr,
  }).run();
}
console.log("50 students inserted!");

const gradesPool = ["A", "B", "C", "D", "F", null];

let enrollmentCount = 0;
for (const student of studentsInserted) {
  // Enroll each student in 1 to 4 random courses
  const numCourses = Math.floor(Math.random() * 4) + 1;
  const shuffledCourses = [...coursesInserted].sort(() => 0.5 - Math.random());
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

    const result = db.insert(enrollments).values({
      student_id: student.id,
      course_id: course.id,
      enrollment_date: enrollmentDateStr,
      grade,
    }).run();
    const enrollmentId = Number(result.lastInsertRowid);
    enrollmentCount++;

    // Add enrollment audit log
    const courseIndex = coursesInserted.findIndex(c => c.id === course.id);
    const courseCode = coursesList[courseIndex]?.code || "COURSE";
    const courseName = coursesList[courseIndex]?.name || "Course";

    const gradeLogStr = grade ? `with grade "${grade}"` : "(in progress)";
    db.insert(auditLogs).values({
      action: "ENROLL_STUDENT",
      entity_type: "ENROLLMENT",
      entity_id: enrollmentId,
      details: `Enrolled student ${student.name} in course ${courseName} [${courseCode}] ${gradeLogStr}.`,
      created_at: enrollmentDateStr,
    }).run();
  }
}
console.log(`${enrollmentCount} enrollments inserted!`);
