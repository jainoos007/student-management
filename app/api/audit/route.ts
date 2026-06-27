import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";

export async function GET() {
  await connection();
  const logs = getAuditLogs(50);
  return NextResponse.json(logs);
}
