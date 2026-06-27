import { NextResponse } from "next/server";
import {
  getTotalStudents,
  getAverageAge,
  getOldestStudent,
  getDepartmentStats,
} from "@/lib/student";
import { getTotalCourses, getAverageEnrollmentsPerStudent } from "@/lib/course";

export async function GET() {
  const totalStudents = getTotalStudents();
  const averageAge = getAverageAge();
  const oldestStudent = getOldestStudent();
  const departmentStats = getDepartmentStats();
  const totalCourses = getTotalCourses();
  const averageEnrollments = getAverageEnrollmentsPerStudent();

  return NextResponse.json({
    totalStudents,
    averageAge,
    oldestStudent,
    departmentStats,
    totalCourses,
    averageEnrollments,
  });
}

