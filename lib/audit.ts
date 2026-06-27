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
  details: string
) {
  const db = getDb();
  const createdAt = new Date().toISOString();
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
