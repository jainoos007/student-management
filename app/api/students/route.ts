import { NextResponse } from "next/server";
import { getStudents, addStudent, searchStudents } from "@/lib/student";

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const page = getPositiveNumber(searchParams.get("page"), 1);
  const limit = getPositiveNumber(searchParams.get("limit"), 10);

  const students = query ? searchStudents(query) : getStudents(page, limit);

  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, department } = body;
  const age = Number(body.age);

  if (!name || !email || !age || !department) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    addStudent({ name, email, age, department });
    return NextResponse.json(
      { message: "Student added successfully" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Error adding student" },
      { status: 500 },
    );
  }
}
