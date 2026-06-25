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

export async function POST(request: Request) {
  const body = await request.json();
  const { name, code } = body;
  const credits = Number(body.credits);

  if (!name || !code || !credits) {
    return NextResponse.json(
      {
        message: "Missing required fields",
      },
      { status: 400 },
    );
  }

  try {
    addCourses({ name, code, credits });
    return NextResponse.json(
      {
        message: "Course added successfully",
      },
      {
        status: 201,
      },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Error adding course",
      },
      {
        status: 500,
      },
    );
  }
}
