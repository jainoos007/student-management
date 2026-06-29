import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getDistinctAuditActions, getDistinctAuditEntityTypes } from "@/lib/db/queries/audit";

export async function GET() {
  await connection();
  const actions = getDistinctAuditActions();
  const entityTypes = getDistinctAuditEntityTypes();

  return NextResponse.json({
    actions,
    entityTypes,
  });
}
