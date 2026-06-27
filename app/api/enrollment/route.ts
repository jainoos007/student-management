import {
  createEnrollment,
  deleteEnrollment,
  updateEnrollment,
} from "@/lib/enrollment";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { student_id, course_id } = body;

  if (!student_id || !course_id) {
    return NextResponse.json(
      {
        message: "Missing required fields",
      },
      {
        status: 400,
      },
    );
  }

  try {
    createEnrollment({ student_id, course_id });

    return NextResponse.json(
      {
        message: "Enrollment created successfully",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Error in creating enrollment",
      },
      {
        status: 500,
      },
    );
  }
}
