import { getDb } from "./db";
import { Course } from "@/types/course";
import { addAuditLog } from "./audit";

type CourseUpdate = Pick<Course, "id" | "name" | "code" | "credits">;

export function getCourses(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(
      `
        SELECT * FROM courses WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as Course[];
}

export function addCourses(course: Omit<Course, "id" | "created_at">) {
  const db = getDb();
  const created_at = new Date().toISOString();
  const result = db
    .prepare(
      `
    INSERT INTO courses (name, code, credits, created_at) VALUES (?,?,?,?)
    `,
    )
    .run(course.name, course.code, course.credits, created_at);

  if (result.changes > 0) {
    addAuditLog(
      "CREATE_COURSE",
      "COURSE",
      Number(result.lastInsertRowid),
      `Created course catalog entry ${course.name} [${course.code}] worth ${course.credits} credits.`
    );
  }
  return result;
}

export function updateCourse(course: CourseUpdate) {
  const db = getDb();
  const result = db
    .prepare(
      `
        UPDATE courses SET name = ? , code = ? , credits = ? WHERE id = ? AND deleted_at IS NULL
        `,
    )
    .run(course.name, course.code, course.credits, course.id);

  if (result.changes > 0) {
    addAuditLog(
      "UPDATE_COURSE",
      "COURSE",
      course.id,
      `Updated course detail parameters for ${course.name} [${course.code}] (credits: ${course.credits}).`
    );
  }
  return result;
}

export function deleteCourse(id: number) {
  const db = getDb();
  const deletedAt = new Date().toISOString();
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL").get(id) as Course | undefined;
  
  // Soft delete course record
  const result = db.prepare(`UPDATE courses SET deleted_at = ? WHERE id = ?`).run(deletedAt, id);

  // Soft delete enrollments mapping for this course
  if (result.changes > 0) {
    db.prepare("UPDATE enrollments SET deleted_at = ? WHERE course_id = ? AND deleted_at IS NULL").run(deletedAt, id);
  }

  if (result.changes > 0 && course) {
    addAuditLog(
      "DELETE_COURSE",
      "COURSE",
      id,
      `Removed course catalog listing for ${course.name} [${course.code}] (soft delete).`
    );
  }
  return result;
}

export function getStudentCourses(studentId: number) {
  const db = getDb();
  return db
    .prepare(
      `
     SELECT c.*, e.id as enrollment_id, e.grade FROM courses c
     JOIN enrollments e ON c.id = e.course_id
     WHERE e.student_id = ? AND c.deleted_at IS NULL AND e.deleted_at IS NULL
    `,
    )
    .all(studentId) as (Course & { enrollment_id: number; grade?: string | null })[];
}

export function searchCourses(query: string): Course[] {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT * FROM courses
        WHERE deleted_at IS NULL AND (name LIKE ? OR code LIKE ? OR credits LIKE ?)
        `,
    )
    .all(`%${query}%`, `%${query}%`, `%${query}%`) as Course[];
}

export function getTotalCourses(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM courses WHERE deleted_at IS NULL").get() as {
    count: number;
  };
  return result.count;
}

export function getTotalCredits(): number {
  const db = getDb();
  const result = db.prepare("SELECT SUM(credits) as sum FROM courses WHERE deleted_at IS NULL").get() as {
    sum: number | null;
  };
  return result.sum || 0;
}

export function getAverageEnrollmentsPerStudent(): number {
  const db = getDb();
  const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL").get() as { count: number }).count;
  if (totalStudents === 0) return 0;
  const totalEnrollments = (db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE deleted_at IS NULL").get() as { count: number }).count;
  return totalEnrollments / totalStudents;
}

export function getPopularCourses(limit: number = 3): (Course & { enrollment_count: number })[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT c.*, COUNT(e.id) as enrollment_count FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY enrollment_count DESC
      LIMIT ?
    `)
    .all(limit) as (Course & { enrollment_count: number })[];
}
