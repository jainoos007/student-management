import { NextResponse } from "next/server";
import { addCourses, getCourses, searchCourses } from "@/lib/course";

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const page = getPositiveNumber(searchParams.get("page"), 1);
  const limit = getPositiveNumber(searchParams.get("limit"), 10);

  const courses = query ? searchCourses(query) : getCourses(page, limit);

  return NextResponse.json(courses);
}

import { CourseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CourseSchema.safeParse({
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

    addCourses(result.data);
    return NextResponse.json(
      { message: "Course added successfully" },
      { status: 201 },
    );
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { message: "A course with this code prefix already exists in catalog" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error adding course" },
      { status: 505 },
    );
  }
}
