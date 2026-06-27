import { getDb } from "./db";
import { Enrollment } from "@/types/enrollment";
import { addAuditLog } from "./audit";

type enrollmentUpdate = Pick<Enrollment, "id" | "student_id" | "course_id">;

export function createEnrollment(
  enrollment: Omit<Enrollment, "id" | "enrollment_date">,
) {
  const db = getDb();
  const enrollmentDate = new Date().toISOString();
  const student = db.prepare("SELECT name FROM students WHERE id = ?").get(enrollment.student_id) as { name: string } | undefined;
  const course = db.prepare("SELECT name, code FROM courses WHERE id = ?").get(enrollment.course_id) as { name: string, code: string } | undefined;
  const result = db
    .prepare(
      `
        INSERT INTO enrollments(student_id, course_id, enrollment_date) VALUES(?, ?, ?)
    `,
    )
    .run(enrollment.student_id, enrollment.course_id, enrollmentDate);

  if (result.changes > 0 && student && course) {
    addAuditLog(
      "ENROLL_STUDENT",
      "ENROLLMENT",
      Number(result.lastInsertRowid),
      `Enrolled student ${student.name} in course ${course.name} [${course.code}].`
    );
  }
  return result;
}

export function updateEnrollment(enrollment: enrollmentUpdate) {
  const db = getDb();

  return db
    .prepare(
      `
        UPDATE enrollments SET student_id = ?, course_id = ? WHERE id = ?
        `,
    )
    .run(enrollment.student_id, enrollment.course_id, enrollment.id);
}

export function deleteEnrollment(id: number) {
  const db = getDb();
  const enrollment = db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id) as Enrollment | undefined;
  let studentName = "";
  let courseCode = "";
  if (enrollment) {
    const student = db.prepare("SELECT name FROM students WHERE id = ?").get(enrollment.student_id) as { name: string } | undefined;
    const course = db.prepare("SELECT code FROM courses WHERE id = ?").get(enrollment.course_id) as { code: string } | undefined;
    if (student) studentName = student.name;
    if (course) courseCode = course.code;
  }
  const result = db.prepare(`DELETE FROM enrollments WHERE id = ?`).run(id);

  if (result.changes > 0 && enrollment) {
    addAuditLog(
      "UNENROLL_STUDENT",
      "ENROLLMENT",
      id,
      `Unenrolled student ${studentName || `ID ${enrollment.student_id}`} from course ${courseCode || `ID ${enrollment.course_id}`}.`
    );
  }
  return result;
}

