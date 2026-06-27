import { NextResponse } from "next/server";
import { getStudents, addStudent, searchStudents, getStudentsByCourse } from "@/lib/student";

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const page = getPositiveNumber(searchParams.get("page"), 1);
  const limit = getPositiveNumber(searchParams.get("limit"), 10);
  const courseIdParam = searchParams.get("courseId");

  let students;
  if (courseIdParam) {
    students = getStudentsByCourse(Number(courseIdParam), page, limit);
  } else if (query) {
    students = searchStudents(query);
  } else {
    students = getStudents(page, limit);
  }

  return NextResponse.json(students);
}

import { StudentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = StudentSchema.safeParse({
      name: body.name,
      email: body.email,
      age: Number(body.age),
      department: body.department,
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 },
      );
    }

    addStudent(result.data);
    return NextResponse.json(
      { message: "Student added successfully" },
      { status: 201 },
    );
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { message: "A student with this email address is already registered" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error adding student" },
      { status: 500 },
    );
  }
}
