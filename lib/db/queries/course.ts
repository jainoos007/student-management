import { getDb } from "../index";
import { Course } from "@/types/course";
import { addAuditLog } from "./audit";
import { courses, enrollments, students } from "../schema";
import { eq, and, isNull, like, or, sql, desc } from "drizzle-orm";

type CourseUpdate = Pick<Course, "id" | "name" | "code" | "credits">;

export function getCourses(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .select()
    .from(courses)
    .where(isNull(courses.deleted_at))
    .limit(limit)
    .offset(offset)
    .all() as Course[];
}

export function addCourses(course: Omit<Course, "id" | "created_at">) {
  const db = getDb();
  const created_at = new Date().toISOString();
  
  return db.transaction((tx) => {
    const result = tx
      .insert(courses)
      .values({
        name: course.name,
        code: course.code,
        credits: course.credits,
        created_at,
      })
      .run();

    if (result.changes > 0) {
      addAuditLog(
        "CREATE_COURSE",
        "COURSE",
        Number(result.lastInsertRowid),
        `Created course catalog entry ${course.name} [${course.code}] worth ${course.credits} credits.`,
        undefined,
        tx
      );
    }
    return result;
  });
}

export function updateCourse(course: CourseUpdate) {
  const db = getDb();
  
  return db.transaction((tx) => {
    const result = tx
      .update(courses)
      .set({
        name: course.name,
        code: course.code,
        credits: course.credits,
      })
      .where(and(eq(courses.id, course.id), isNull(courses.deleted_at)))
      .run();

    if (result.changes > 0) {
      addAuditLog(
        "UPDATE_COURSE",
        "COURSE",
        course.id,
        `Updated course detail parameters for ${course.name} [${course.code}] (credits: ${course.credits}).`,
        undefined,
        tx
      );
    }
    return result;
  });
}

export function deleteCourse(id: number) {
  const db = getDb();
  const deletedAt = new Date().toISOString();
  
  return db.transaction((tx) => {
    const course = tx
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), isNull(courses.deleted_at)))
      .get() as Course | undefined;
    
    // Soft delete course record
    const result = tx
      .update(courses)
      .set({ deleted_at: deletedAt })
      .where(eq(courses.id, id))
      .run();

    // Soft delete enrollments mapping for this course
    if (result.changes > 0) {
      tx
        .update(enrollments)
        .set({ deleted_at: deletedAt })
        .where(and(eq(enrollments.course_id, id), isNull(enrollments.deleted_at)))
        .run();
    }

    if (result.changes > 0 && course) {
      addAuditLog(
        "DELETE_COURSE",
        "COURSE",
        id,
        `Removed course catalog listing for ${course.name} [${course.code}] (soft delete).`,
        undefined,
        tx
      );
    }
    return result;
  });
}

export function getStudentCourses(studentId: number) {
  const db = getDb();
  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      created_at: courses.created_at,
      deleted_at: courses.deleted_at,
      enrollment_id: enrollments.id,
      grade: enrollments.grade,
    })
    .from(courses)
    .innerJoin(enrollments, eq(courses.id, enrollments.course_id))
    .where(
      and(
        eq(enrollments.student_id, studentId),
        isNull(courses.deleted_at),
        isNull(enrollments.deleted_at)
      )
    )
    .all() as (Course & { enrollment_id: number; grade?: string | null })[];
}

export function searchCourses(query: string): Course[] {
  const db = getDb();
  const searchVal = `%${query}%`;
  return db
    .select()
    .from(courses)
    .where(
      and(
        isNull(courses.deleted_at),
        or(
          like(courses.name, searchVal),
          like(courses.code, searchVal),
          sql`CAST(${courses.credits} AS TEXT) LIKE ${searchVal}`
        )
      )
    )
    .all() as Course[];
}

export function getTotalCourses(): number {
  const db = getDb();
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(isNull(courses.deleted_at))
    .get();
  return result?.count ?? 0;
}

export function getTotalCredits(): number {
  const db = getDb();
  const result = db
    .select({ sum: sql<number>`sum(${courses.credits})` })
    .from(courses)
    .where(isNull(courses.deleted_at))
    .get();
  return result?.sum ?? 0;
}

export function getAverageEnrollmentsPerStudent(): number {
  const db = getDb();
  const totalStudentsResult = db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(isNull(students.deleted_at))
    .get();
  const totalStudents = totalStudentsResult?.count ?? 0;
  if (totalStudents === 0) return 0;
  
  const totalEnrollmentsResult = db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(isNull(enrollments.deleted_at))
    .get();
  const totalEnrollments = totalEnrollmentsResult?.count ?? 0;
  
  return totalEnrollments / totalStudents;
}

export function getPopularCourses(limit: number = 3): (Course & { enrollment_count: number })[] {
  const db = getDb();
  const countExpression = sql<number>`count(${enrollments.id})`;
  
  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      created_at: courses.created_at,
      deleted_at: courses.deleted_at,
      enrollment_count: countExpression,
    })
    .from(courses)
    .leftJoin(
      enrollments,
      and(eq(courses.id, enrollments.course_id), isNull(enrollments.deleted_at))
    )
    .where(isNull(courses.deleted_at))
    .groupBy(courses.id)
    .orderBy(desc(countExpression))
    .limit(limit)
    .all() as (Course & { enrollment_count: number })[];
}
