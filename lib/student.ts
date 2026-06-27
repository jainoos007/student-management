import { getDb } from "./db";
import type { Student } from "@/types/student";
import { addAuditLog } from "./audit";

type StudentUpdate = Pick<
  Student,
  "id" | "name" | "email" | "age" | "department"
>;

export function getStudents(page: number = 1, limit: number = 10): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(`SELECT * FROM students LIMIT ? OFFSET ?`)
    .all(limit, offset) as Student[];
}

export function addStudent(student: Omit<Student, "id" | "created_at">) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
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

  if (result.changes > 0) {
    addAuditLog(
      "CREATE_STUDENT",
      "STUDENT",
      Number(result.lastInsertRowid),
      `Registered student ${student.name} (${student.email}) in ${student.department} department.`
    );
  }
  return result;
}

export function updateStudent(student: StudentUpdate) {
  const db = getDb();
  const result = db
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

  if (result.changes > 0) {
    addAuditLog(
      "UPDATE_STUDENT",
      "STUDENT",
      student.id,
      `Updated details for student ${student.name} (age ${student.age}, dept ${student.department}).`
    );
  }
  return result;
}

export function deleteStudent(id: number) {
  const db = getDb();
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id) as Student | undefined;
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(id);

  if (result.changes > 0 && student) {
    addAuditLog(
      "DELETE_STUDENT",
      "STUDENT",
      id,
      `Deleted student record for ${student.name} (${student.email}).`
    );
  }
  return result;
}

export function searchStudents(query: string): Student[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT * FROM students
    WHERE name LIKE ? OR email LIKE ? OR department LIKE ?`,
    )
    .all(`%${query}%`, `%${query}%`, `%${query}%`) as Student[];
}

export function getTotalStudents(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM students").get() as {
    count: number;
  };
  return result.count;
}

export function getAverageAge(): number {
  const db = getDb();
  const result = db
    .prepare("SELECT AVG(age) as average FROM students")
    .get() as { average: number | null };
  return result.average ?? 0;
}

export function getOldestStudent(): Student | null {
  const db = getDb();
  const result = db
    .prepare(
      `
    SELECT * FROM students
    ORDER BY age DESC
    LIMIT 1
    `,
    )
    .get() as Student | undefined;
  return result ?? null;
}

export function getDepartmentStats(): { department: string; count: number }[] {
  const db = getDb();
  const result = db
    .prepare(
      `
    SELECT department, COUNT(*) as count
    FROM students
    GROUP BY department
    `,
    )
    .all() as { department: string; count: number }[];
  return result;
}

export function getStudentsByCourse(courseId: number, page: number = 1, limit: number = 10): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(`
      SELECT s.* FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE e.course_id = ?
      LIMIT ? OFFSET ?
    `)
    .all(courseId, limit, offset) as Student[];
}

export function getTotalStudentsByCourse(courseId: number): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM students s
    JOIN enrollments e ON s.id = e.student_id
    WHERE e.course_id = ?
  `).get(courseId) as { count: number };
  return result.count;
}

export function getStudentsByDepartment(
  department: string,
  page: number = 1,
  limit: number = 10
): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(`SELECT * FROM students WHERE department = ? LIMIT ? OFFSET ?`)
    .all(department, limit, offset) as Student[];
}

export function getDepartments(): string[] {
  const db = getDb();
  const results = db
    .prepare("SELECT DISTINCT department FROM students ORDER BY department ASC")
    .all() as { department: string }[];
  return results.map((r) => r.department);
}

