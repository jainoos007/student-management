import { getDb } from "./db";
import { auditLogs } from "./db/schema";
import { desc, eq, and, or, like, sql } from "drizzle-orm";

export type AuditLog = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  created_at: string;
};

export function addAuditLog(
  action: string,
  entityType: string,
  entityId: number | null,
  details: string,
  createdAt: string = new Date().toISOString()
) {
  const db = getDb();
  try {
    return db
      .insert(auditLogs)
      .values({
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        created_at: createdAt,
      })
      .run();
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export function getAuditLogs(limit: number = 20): AuditLog[] {
  const db = getDb();
  try {
    return db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.created_at))
      .limit(limit)
      .all() as AuditLog[];
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}

export function queryAuditLogs(options: {
  query?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}): { logs: AuditLog[]; totalCount: number } {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (options.action && options.action !== "all-actions") {
    conditions.push(eq(auditLogs.action, options.action));
  }
  
  if (options.entityType && options.entityType !== "all-entities") {
    conditions.push(eq(auditLogs.entity_type, options.entityType));
  }

  if (options.query) {
    const searchVal = `%${options.query}%`;
    conditions.push(
      or(
        like(auditLogs.details, searchVal),
        like(auditLogs.action, searchVal),
        sql`CAST(${auditLogs.entity_id} AS TEXT) LIKE ${searchVal}`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const logs = db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.created_at))
      .limit(limit)
      .offset(offset)
      .all() as AuditLog[];

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause)
      .get();

    return { logs, totalCount: countResult?.count ?? 0 };
  } catch (err) {
    console.error("Failed to query audit logs:", err);
    return { logs: [], totalCount: 0 };
  }
}

export function getDistinctAuditActions(): string[] {
  const db = getDb();
  try {
    const rows = db
      .select({ action: auditLogs.action })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(auditLogs.action)
      .all();
    return rows.map(r => r.action);
  } catch (err) {
    console.error("Failed to query actions:", err);
    return [];
  }
}

export function getDistinctAuditEntityTypes(): string[] {
  const db = getDb();
  try {
    const rows = db
      .select({ entity_type: auditLogs.entity_type })
      .from(auditLogs)
      .groupBy(auditLogs.entity_type)
      .orderBy(auditLogs.entity_type)
      .all();
    return rows.map(r => r.entity_type);
  } catch (err) {
    console.error("Failed to query entities:", err);
    return [];
  }
}
