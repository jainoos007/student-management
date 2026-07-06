import { getDb } from "../index";
import { Enrollment } from "@/types/enrollment";
import { addAuditLog } from "./audit";
import { enrollments, students, courses } from "../schema";
import { eq, and, isNull, sql } from "drizzle-orm";

type enrollmentUpdate = Pick<Enrollment, "id" | "student_id" | "course_id">;

export function createEnrollment(
  enrollment: Omit<Enrollment, "id" | "enrollment_date">,
) {
  const db = getDb();
  const enrollmentDate = new Date().toISOString();
  
  return db.transaction((tx) => {
    const student = tx
      .select({ name: students.name })
      .from(students)
      .where(and(eq(students.id, enrollment.student_id), isNull(students.deleted_at)))
      .get() as { name: string } | undefined;
      
    const course = tx
      .select({ name: courses.name, code: courses.code })
      .from(courses)
      .where(and(eq(courses.id, enrollment.course_id), isNull(courses.deleted_at)))
      .get() as { name: string; code: string } | undefined;
    
    if (!student || !course) {
      throw new Error("Student or Course not found or has been deleted.");
    }

    const result = tx
      .insert(enrollments)
      .values({
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        enrollment_date: enrollmentDate,
      })
      .run();

    if (result.changes > 0 && student && course) {
      addAuditLog(
        "ENROLL_STUDENT",
        "ENROLLMENT",
        Number(result.lastInsertRowid),
        `Enrolled student ${student.name} in course ${course.name} [${course.code}].`,
        undefined,
        tx
      );
    }
    return result;
  });
}

export function updateEnrollment(enrollment: enrollmentUpdate) {
  const db = getDb();

  return db
    .update(enrollments)
    .set({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
    })
    .where(and(eq(enrollments.id, enrollment.id), isNull(enrollments.deleted_at)))
    .run();
}

export function deleteEnrollment(id: number) {
  const db = getDb();
  const deletedAt = new Date().toISOString();
  
  return db.transaction((tx) => {
    const enrollment = tx
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, id), isNull(enrollments.deleted_at)))
      .get() as Enrollment | undefined;
      
    let studentName = "";
    let courseCode = "";
    if (enrollment) {
      const student = tx
        .select({ name: students.name })
        .from(students)
        .where(eq(students.id, enrollment.student_id))
        .get() as { name: string } | undefined;
        
      const course = tx
        .select({ code: courses.code })
        .from(courses)
        .where(eq(courses.id, enrollment.course_id))
        .get() as { code: string } | undefined;
        
      if (student) studentName = student.name;
      if (course) courseCode = course.code;
    }
    
    // Soft delete enrollment mapping
    const result = tx
      .update(enrollments)
      .set({ deleted_at: deletedAt })
      .where(eq(enrollments.id, id))
      .run();

    if (result.changes > 0 && enrollment) {
      addAuditLog(
        "UNENROLL_STUDENT",
        "ENROLLMENT",
        id,
        `Unenrolled student ${studentName || `ID ${enrollment.student_id}`} from course ${courseCode || `ID ${enrollment.course_id}`} (soft delete).`,
        undefined,
        tx
      );
    }
    return result;
  });
}

export function getEnrollmentTrends(): { date: string; count: number }[] {
  const db = getDb();
  try {
    const dateExpr = sql<string>`SUBSTR(${enrollments.enrollment_date}, 1, 10)`;
    return db
      .select({
        date: dateExpr,
        count: sql<number>`COUNT(*)`,
      })
      .from(enrollments)
      .where(isNull(enrollments.deleted_at))
      .groupBy(dateExpr)
      .orderBy(dateExpr)
      .all() as { date: string; count: number }[];
  } catch (err) {
    console.error("Failed to query enrollment trends:", err);
    return [];
  }
}

export function updateEnrollmentGrade(id: number, grade: string | null) {
  const db = getDb();
  
  // Make sure the grade is in uppercase or null
  const formattedGrade = grade && grade.trim() !== "" ? grade.trim().toUpperCase() : null;
  
  // Validate grade
  if (formattedGrade && !["A", "B", "C", "D", "F"].includes(formattedGrade)) {
    throw new Error("Invalid grade format. Grade must be A, B, C, D, F, or empty.");
  }

  return db.transaction((tx) => {
    const enrollment = tx
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .get() as Enrollment | undefined;
      
    if (!enrollment) {
      throw new Error("Enrollment record not found.");
    }
    
    const student = tx
      .select({ name: students.name })
      .from(students)
      .where(eq(students.id, enrollment.student_id))
      .get() as { name: string } | undefined;
      
    const course = tx
      .select({ name: courses.name, code: courses.code })
      .from(courses)
      .where(eq(courses.id, enrollment.course_id))
      .get() as { name: string; code: string } | undefined;

    const result = tx
      .update(enrollments)
      .set({ grade: formattedGrade })
      .where(eq(enrollments.id, id))
      .run();
    
    if (result.changes > 0 && student && course) {
      const logStr = formattedGrade ? `to grade "${formattedGrade}"` : "to (in progress)";
      addAuditLog(
        "UPDATE_GRADE",
        "ENROLLMENT",
        id,
        `Updated course grade for ${student.name} in ${course.name} [${course.code}] ${logStr}.`,
        new Date().toISOString(),
        tx
      );
    }
    return result;
  });
}
