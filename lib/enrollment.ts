import { getDb } from "./db";
import { Enrollment } from "@/types/enrollment";

type enrollmentUpdate = Pick<Enrollment, "id" | "student_id" | "course_id">;

export function createEnrollment(
  enrollment: Omit<Enrollment, "id" | "enrollment_date">,
) {
  const db = getDb();
  const enrollmentDate = new Date().toISOString();
  return db
    .prepare(
      `
        INSERT INTO enrollments(student_id, course_id, enrollmentment_date) VALUES(?, ?, ?)
    `,
    )
    .run(enrollment.student_id, enrollment.course_id, enrollmentDate);
}

export function updateEnrollment(enrollment: enrollmentUpdate) {
  const db = getDb();

  return db
    .prepare(
      `
        UPDATE enrollements SET student_id = ?, course_id = ? WHERE id = ?
        `,
    )
    .run(enrollment.student_id, enrollment.course_id);
}

export function deleteEnrollement(id: number) {
  const db = getDb();
  return db.prepare(`DELETE FROM enrollments WHERE id = ?`).run(id);
}
