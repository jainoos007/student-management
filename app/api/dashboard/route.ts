import { NextResponse } from "next/server";
import {
  getTotalStudents,
  getAverageAge,
  getOldestStudent,
  getDepartmentStats,
} from "@/lib/db/queries/student";
import { getTotalCourses, getAverageEnrollmentsPerStudent, getPopularCourses } from "@/lib/db/queries/course";
import { getEnrollmentTrends } from "@/lib/db/queries/enrollment";

export async function GET() {
  const totalStudents = getTotalStudents();
  const averageAge = getAverageAge();
  const oldestStudent = getOldestStudent();
  const departmentStats = getDepartmentStats();
  const totalCourses = getTotalCourses();
  const averageEnrollments = getAverageEnrollmentsPerStudent();
  const popularCourses = getPopularCourses(5);
  const enrollmentTrends = getEnrollmentTrends();

  return NextResponse.json({
    totalStudents,
    averageAge,
    oldestStudent,
    departmentStats,
    totalCourses,
    averageEnrollments,
    popularCourses,
    enrollmentTrends,
  });
}

