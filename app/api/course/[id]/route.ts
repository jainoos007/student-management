import { deleteCourse, updateCourse } from "@/lib/course";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const body = await request.json();
  const { id } = await ctx.params;

  if (!body.name || !body.code || !body.credits) {
    return NextResponse.json(
      {
        message: "Missing required fields",
      },
      { status: 400 },
    );
  }

  if (body.credits <= 0) {
    return NextResponse.json(
      {
        message: "Credits must be positive number",
      },
      {
        status: 400,
      },
    );
  }
  try {
    updateCourse({
      id: Number(id),
      name: body.name,
      code: body.code,
      credits: Number(body.credits),
    });

    return NextResponse.json(
      {
        message: "Course updated successfully",
      },
      {
        status: 201,
      },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Error updating course",
      },
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
