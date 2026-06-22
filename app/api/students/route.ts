import { NextResponse } from "next/server";
import { getStudents, addStudent } from "@/lib/student";

export async function GET() {
  const students = getStudents();

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
