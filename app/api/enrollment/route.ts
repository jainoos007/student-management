import {
  createEnrollment,
  deleteEnrollment,
  updateEnrollment,
} from "@/lib/enrollment";
import { NextResponse } from "next/server";

import { EnrollmentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = EnrollmentSchema.safeParse({
      student_id: Number(body.student_id),
      course_id: Number(body.course_id),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 },
      );
    }

    createEnrollment(result.data);

    return NextResponse.json(
      {
        message: "Enrollment created successfully",
      },
      { status: 200 },
    );
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { message: "This student is already enrolled in the specified course" },
        { status: 409 },
      );
    }
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
