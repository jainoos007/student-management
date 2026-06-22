import { NextRequest, NextResponse } from "next/server";
import { updateStudent } from "@/lib/student";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const body = await request.json();
  const { id } = await ctx.params;

  updateStudent({
    id: Number(id),
    name: body.name,
    email: body.email,
    age: body.age,
    department: body.department,
  });

  return NextResponse.json({ message: "Student updated successfully" });
}
