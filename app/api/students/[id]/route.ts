import { NextRequest, NextResponse } from "next/server";
import { updateStudent, deleteStudent } from "@/lib/student";

import { StudentUpdateSchema } from "@/lib/schemas";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const { id } = await ctx.params;

    const result = StudentUpdateSchema.safeParse({
      id: Number(id),
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

    updateStudent(result.data);

    return NextResponse.json(
      { message: "Student updated successfully" },
      { status: 200 },
    );
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { message: "Another student is already using this email address" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error updating student" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  deleteStudent(Number(id));
  return NextResponse.json(
    {
      message: "Student deleted successfully",
    },
    { status: 204 },
  );
}
