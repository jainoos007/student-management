import { deleteEnrollement, updateEnrollment } from "@/lib/enrollment";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const body = await request.json();
  const { id } = await ctx.params;
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
    updateEnrollment({
      id: Number(id),
      student_id: Number(student_id),
      course_id: Number(course_id),
    });
    return NextResponse.json(
      {
        message: "Enrollment updated success",
      },
      {
        status: 201,
      },
    );
  } catch {
    NextResponse.json(
      {
        message: "Error updating enrollment",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  try {
    deleteEnrollement(Number(id));
    return NextResponse.json(
      {
        message: "Enrollment delted successfully",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Error deleting enrollment",
      },
      { status: 500 },
    );
  }
}
