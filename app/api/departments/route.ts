import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getDepartments } from "@/lib/student";

export async function GET() {
  await connection();
  const depts = getDepartments();
  return NextResponse.json(depts);
}
