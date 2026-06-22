import { NextResponse } from "next/server";
import { getStudents } from "@/lib/student";

export async function GET() {
  const students = getStudents();

  return NextResponse.json(students);
}
