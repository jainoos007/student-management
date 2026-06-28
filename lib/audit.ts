import { getDb } from "./db";

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
      .prepare(
        `INSERT INTO audit_logs (action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .run(action, entityType, entityId, details, createdAt);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export function getAuditLogs(limit: number = 20): AuditLog[] {
  const db = getDb();
  try {
    return db
      .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as AuditLog[];
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

  let sql = `SELECT * FROM audit_logs`;
  let countSql = `SELECT COUNT(*) as count FROM audit_logs`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.action && options.action !== "all-actions") {
    conditions.push(`action = ?`);
    params.push(options.action);
  }
  
  if (options.entityType && options.entityType !== "all-entities") {
    conditions.push(`entity_type = ?`);
    params.push(options.entityType);
  }

  if (options.query) {
    conditions.push(`(details LIKE ? OR action LIKE ? OR CAST(entity_id AS TEXT) LIKE ?)`);
    const searchVal = `%${options.query}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ` + conditions.join(` AND `);
    sql += whereClause;
    countSql += whereClause;
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  
  try {
    const logs = db.prepare(sql).all(...params, limit, offset) as AuditLog[];
    const countResult = db.prepare(countSql).get(...params) as { count: number };
    return { logs, totalCount: countResult.count };
  } catch (err) {
    console.error("Failed to query audit logs:", err);
    return { logs: [], totalCount: 0 };
  }
}

export function getDistinctAuditActions(): string[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT DISTINCT action FROM audit_logs ORDER BY action ASC").all() as { action: string }[];
    return rows.map(r => r.action);
  } catch (err) {
    console.error("Failed to query actions:", err);
    return [];
  }
}

export function getDistinctAuditEntityTypes(): string[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type ASC").all() as { entity_type: string }[];
    return rows.map(r => r.entity_type);
  } catch (err) {
    console.error("Failed to query entities:", err);
    return [];
  }
}
