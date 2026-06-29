import { getDb } from "./db";
import type { Student } from "@/types/student";
import { addAuditLog } from "./audit";
import { students, enrollments, courses } from "./db/schema";
import { eq, and, isNull, isNotNull, like, or, sql, desc, avg } from "drizzle-orm";

type StudentUpdate = Pick<
  Student,
  "id" | "name" | "email" | "age" | "department"
>;

const gpaSubquery = sql<number>`(
  SELECT SUM(
    CASE UPPER(enrollments.grade)
      WHEN 'A' THEN 4.0
      WHEN 'B' THEN 3.0
      WHEN 'C' THEN 2.0
      WHEN 'D' THEN 1.0
      WHEN 'F' THEN 0.0
      ELSE 0.0
    END * courses.credits
  ) / CAST(SUM(courses.credits) AS REAL)
  FROM enrollments
  JOIN courses ON enrollments.course_id = courses.id
  WHERE enrollments.student_id = students.id
    AND enrollments.grade IS NOT NULL 
    AND enrollments.grade != '' 
    AND enrollments.deleted_at IS NULL 
    AND courses.deleted_at IS NULL
)`.as("gpa");

export function getStudents(page: number = 1, limit: number = 10): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students)
    .where(isNull(students.deleted_at))
    .orderBy(desc(students.created_at), desc(students.id))
    .limit(limit)
    .offset(offset)
    .all() as unknown as Student[];
}

export function addStudent(student: Omit<Student, "id" | "created_at">) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
    .insert(students)
    .values({
      name: student.name,
      email: student.email,
      age: student.age,
      department: student.department,
      created_at: createdAt,
    })
    .run();

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
    .update(students)
    .set({
      name: student.name,
      email: student.email,
      age: student.age,
      department: student.department,
    })
    .where(and(eq(students.id, student.id), isNull(students.deleted_at)))
    .run();

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
  
  const student = db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deleted_at)))
    .get() as Student | undefined;
  
  // Soft delete student record
  const result = db
    .update(students)
    .set({ deleted_at: deletedAt })
    .where(eq(students.id, id))
    .run();

  // Soft delete associated enrollment mappings
  if (result.changes > 0) {
    db
      .update(enrollments)
      .set({ deleted_at: deletedAt })
      .where(and(eq(enrollments.student_id, id), isNull(enrollments.deleted_at)))
      .run();
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
  const searchVal = `%${query}%`;
  return db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students)
    .where(
      and(
        isNull(students.deleted_at),
        or(
          like(students.name, searchVal),
          like(students.email, searchVal),
          like(students.department, searchVal)
        )
      )
    )
    .all() as unknown as Student[];
}

export function getTotalStudents(): number {
  const db = getDb();
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(isNull(students.deleted_at))
    .get();
  return result?.count ?? 0;
}

export function getAverageAge(): number {
  const db = getDb();
  const result = db
    .select({ average: sql<number>`avg(${students.age})` })
    .from(students)
    .where(isNull(students.deleted_at))
    .get();
  return result?.average ?? 0;
}

export function getOldestStudent(): Student | null {
  const db = getDb();
  const result = db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students)
    .where(isNull(students.deleted_at))
    .orderBy(desc(students.age))
    .limit(1)
    .get() as unknown as Student | undefined;
  return result ?? null;
}

export function getDepartmentStats(): { department: string; count: number }[] {
  const db = getDb();
  return db
    .select({
      department: students.department,
      count: sql<number>`count(*)`,
    })
    .from(students)
    .where(isNull(students.deleted_at))
    .groupBy(students.department)
    .all() as { department: string; count: number }[];
}

export function getStudentsByCourse(
  courseId: number,
  page: number = 1,
  limit: number = 10,
): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students)
    .innerJoin(enrollments, eq(students.id, enrollments.student_id))
    .where(
      and(
        eq(enrollments.course_id, courseId),
        isNull(students.deleted_at),
        isNull(enrollments.deleted_at)
      )
    )
    .limit(limit)
    .offset(offset)
    .all() as unknown as Student[];
}

export function getTotalStudentsByCourse(courseId: number): number {
  const db = getDb();
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .innerJoin(enrollments, eq(students.id, enrollments.student_id))
    .where(
      and(
        eq(enrollments.course_id, courseId),
        isNull(students.deleted_at),
        isNull(enrollments.deleted_at)
      )
    )
    .get();
  return result?.count ?? 0;
}

export function getStudentsByDepartment(
  department: string,
  page: number = 1,
  limit: number = 10,
): Student[] {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students)
    .where(and(eq(students.department, department), isNull(students.deleted_at)))
    .limit(limit)
    .offset(offset)
    .all() as unknown as Student[];
}

export function getDepartments(): string[] {
  const db = getDb();
  const results = db
    .select({ department: students.department })
    .from(students)
    .where(isNull(students.deleted_at))
    .groupBy(students.department)
    .orderBy(students.department)
    .all();
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

  const conditions: any[] = [isNull(students.deleted_at)];

  let queryBuilder = db
    .selectDistinct({
      id: students.id,
      name: students.name,
      email: students.email,
      age: students.age,
      department: students.department,
      created_at: students.created_at,
      gpa: gpaSubquery,
    })
    .from(students);

  if (options.courseId) {
    queryBuilder = queryBuilder.innerJoin(
      enrollments,
      eq(students.id, enrollments.student_id)
    ) as any;
    conditions.push(eq(enrollments.course_id, options.courseId));
    conditions.push(isNull(enrollments.deleted_at));
  }

  if (options.department) {
    conditions.push(eq(students.department, options.department));
  }

  if (options.query) {
    const likeQuery = `%${options.query}%`;
    conditions.push(
      or(
        like(students.name, likeQuery),
        like(students.email, likeQuery),
        like(students.department, likeQuery)
      )
    );
  }

  return queryBuilder
    .where(and(...conditions))
    .orderBy(desc(students.created_at), desc(students.id))
    .limit(limit)
    .offset(offset)
    .all() as unknown as Student[];
}

export function getAverageGPA(): number {
  const db = getDb();
  try {
    const gpaSubqueryTable = db
      .select({
        gpa: sql<number>`(
          SELECT SUM(
            CASE UPPER(enrollments.grade)
              WHEN 'A' THEN 4.0
              WHEN 'B' THEN 3.0
              WHEN 'C' THEN 2.0
              WHEN 'D' THEN 1.0
              WHEN 'F' THEN 0.0
              ELSE 0.0
            END * courses.credits
          ) / CAST(SUM(courses.credits) AS REAL)
          FROM enrollments
          JOIN courses ON enrollments.course_id = courses.id
          WHERE enrollments.student_id = students.id
            AND enrollments.grade IS NOT NULL 
            AND enrollments.grade != '' 
            AND enrollments.deleted_at IS NULL 
            AND courses.deleted_at IS NULL
        )`.as("gpa"),
      })
      .from(students)
      .where(isNull(students.deleted_at))
      .as("gpa_subquery");

    const result = db
      .select({ avg_gpa: avg(gpaSubqueryTable.gpa) })
      .from(gpaSubqueryTable)
      .where(isNotNull(gpaSubqueryTable.gpa))
      .get();
      
    return Number(result?.avg_gpa ?? 0);
  } catch (err) {
    console.error("Failed to query average GPA:", err);
    return 0;
  }
}

export function getStudent(id: number): Student | null {
  const db = getDb();
  try {
    const student = db
      .select({
        id: students.id,
        name: students.name,
        email: students.email,
        age: students.age,
        department: students.department,
        created_at: students.created_at,
        gpa: gpaSubquery,
      })
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deleted_at)))
      .get() as unknown as Student | undefined;
    return student ?? null;
  } catch (err) {
    console.error("Failed to fetch student by id:", err);
    return null;
  }
}
