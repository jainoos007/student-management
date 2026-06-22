import { NextResponse } from "next/server";
import {
  getTotalStudents,
  getAverageAge,
  getOldestStudent,
  getDepartmentStats,
} from "@/lib/student";

export async function GET() {
  const totalStudents = getTotalStudents();
  const averageAge = getAverageAge();
  const oldestStudent = getOldestStudent();
  const departmentStats = getDepartmentStats();

  return NextResponse.json({
    totalStudents,
    averageAge,
    oldestStudent,
    departmentStats,
  });
}
