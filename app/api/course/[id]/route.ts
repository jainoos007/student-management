import { deleteCourse, updateCourse } from "@/lib/course";
import { NextRequest, NextResponse } from "next/server";

import { CourseUpdateSchema } from "@/lib/schemas";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const { id } = await ctx.params;

    const result = CourseUpdateSchema.safeParse({
      id: Number(id),
      name: body.name,
      code: body.code,
      credits: Number(body.credits),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 },
      );
    }

    updateCourse(result.data);

    return NextResponse.json(
      { message: "Course updated successfully" },
      { status: 200 },
    );
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { message: "Another course in the catalog is already using this code prefix" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error updating course" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  deleteCourse(Number(id));
  return NextResponse.json(
    {
      message: "Course deleted successfully",
    },
    { status: 200 },
  );
}
