import { getStudentCourses } from "@/lib/course";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  try {
    const courses = getStudentCourses(Number(id));
    return NextResponse.json(
      {
        success: true,
        message: "Courses fetched successfully",
        data: courses,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching courses",
      },
      { status: 500 },
    );
  }
}
