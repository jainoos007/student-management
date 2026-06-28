import { connection } from "next/server";
import { NextResponse } from "next/server";
import { queryAuditLogs } from "@/lib/audit";

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || undefined;
  const action = searchParams.get("action")?.trim() || undefined;
  const entityType = searchParams.get("entity_type")?.trim() || undefined;
  const page = getPositiveNumber(searchParams.get("page"), 1);
  const limit = getPositiveNumber(searchParams.get("limit"), 20);

  const result = queryAuditLogs({
    query,
    action,
    entityType,
    page,
    limit,
  });

  return NextResponse.json(result);
}
