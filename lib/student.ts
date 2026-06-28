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
    .prepare(`SELECT * FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
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
      `Registered student ${student.name} (${student.email}) in ${student.department} department.`,
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
    WHERE id = ? AND deleted_at IS NULL`,
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
      `Updated details for student ${student.name} (age ${student.age}, dept ${student.department}).`,
    );
  }
  return result;
}

export function deleteStudent(id: number) {
  const db = getDb();
  const deletedAt = new Date().toISOString();
  const student = db.prepare("SELECT * FROM students WHERE id = ? AND deleted_at IS NULL").get(id) as
    | Student
    | undefined;
  
  // Soft delete student record
  const result = db.prepare("UPDATE students SET deleted_at = ? WHERE id = ?").run(deletedAt, id);

  // Soft delete associated enrollment mappings
  if (result.changes > 0) {
    db.prepare("UPDATE enrollments SET deleted_at = ? WHERE student_id = ? AND deleted_at IS NULL").run(deletedAt, id);
  }

  if (result.changes > 0 && student) {
    addAuditLog(
      "DELETE_STUDENT",
      "STUDENT",
      id,
      `Deleted student record for ${student.name} (${student.email}) (soft delete).`,
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
    WHERE deleted_at IS NULL AND (name LIKE ? OR email LIKE ? OR department LIKE ?)`,
    )
    .all(`%${query}%`, `%${query}%`, `%${query}%`) as Student[];
}

export function getTotalStudents(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL").get() as {
    count: number;
  };
  return result.count;
}

export function getAverageAge(): number {
  const db = getDb();
  const result = db
    .prepare("SELECT AVG(age) as average FROM students WHERE deleted_at IS NULL")
    .get() as { average: number | null };
  return result.average ?? 0;
}

export function getOldestStudent(): Student | null {
  const db = getDb();
  const result = db
    .prepare(
      `
    SELECT * FROM students
    WHERE deleted_at IS NULL
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
    WHERE deleted_at IS NULL
    GROUP BY department
    `,
    )
    .all() as { department: string; count: number }[];
  return result;
}

export function getStudentsByCourse(
  courseId: number,
  page: number = 1,
  limit: number = 10,
): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(
      `
      SELECT s.* FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE e.course_id = ? AND s.deleted_at IS NULL AND e.deleted_at IS NULL
      LIMIT ? OFFSET ?
    `,
    )
    .all(courseId, limit, offset) as Student[];
}

export function getTotalStudentsByCourse(courseId: number): number {
  const db = getDb();
  const result = db
    .prepare(
      `
    SELECT COUNT(*) as count FROM students s
    JOIN enrollments e ON s.id = e.student_id
    WHERE e.course_id = ? AND s.deleted_at IS NULL AND e.deleted_at IS NULL
  `,
    )
    .get(courseId) as { count: number };
  return result.count;
}

export function getStudentsByDepartment(
  department: string,
  page: number = 1,
  limit: number = 10,
): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(`SELECT * FROM students WHERE department = ? AND deleted_at IS NULL LIMIT ? OFFSET ?`)
    .all(department, limit, offset) as Student[];
}

export function getDepartments(): string[] {
  const db = getDb();
  const results = db
    .prepare("SELECT DISTINCT department FROM students WHERE deleted_at IS NULL ORDER BY department ASC")
    .all() as { department: string }[];
  return results.map((r) => r.department);
}

export function queryStudents(options: {
  query?: string;
  courseId?: number;
  department?: string;
  page?: number;
  limit?: number;
}): Student[] {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const offset = (page - 1) * limit;

  const db = getDb();

  let sql = `SELECT DISTINCT s.* FROM students s`;
  const params: any[] = [];
  const conditions: string[] = [`s.deleted_at IS NULL`];

  if (options.courseId) {
    sql += ` JOIN enrollments e ON s.id = e.student_id`;
    conditions.push(`e.course_id = ?`);
    conditions.push(`e.deleted_at IS NULL`);
    params.push(options.courseId);
  }

  if (options.department) {
    conditions.push(`s.department = ?`);
    params.push(options.department);
  }

  if (options.query) {
    conditions.push(`(s.name LIKE ? OR s.email LIKE ? OR s.department LIKE ?)`);
    const likeQuery = `%${options.query}%`;
    params.push(likeQuery, likeQuery, likeQuery);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(` AND `);
  }

  sql += ` ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(sql).all(...params) as Student[];
}
