import { getDb } from "./db";
import type { Student } from "@/types/student";

type StudentUpdate = Pick<
  Student,
  "id" | "name" | "email" | "age" | "department"
>;

export function getStudents(): Student[] {
  const db = getDb();
  return db.prepare("SELECT * FROM students").all() as Student[];
}

export function addStudent(student: Omit<Student, "id" | "created_at">) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  return db
    .prepare(
      `
      INSERT INTO students (name, email, age, department, created_at) VALUES (?, ?, ?, ?, ?) `,
    )
    .run(
      student.name,
      student.email,
      student.age,
      student.department,
      createdAt,
    );
}

export function updateStudent(student: StudentUpdate) {
  const db = getDb();
  return db
    .prepare(
      `
    UPDATE students
    SET name = ?, email = ?, age = ?, department = ?
    WHERE id = ?`,
    )
    .run(
      student.name,
      student.email,
      student.age,
      student.department,
      student.id,
    );
}
