import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Simple env loader for scripts running outside Next.js
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

const dbUrl = process.env.DATABASE_URL || "database/students.db";

let sqliteDb: Database.Database | null = null;
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getRawDb() {
  sqliteDb ??= new Database(dbUrl);
  return sqliteDb;
}

export function getDb() {
  if (!drizzleDb) {
    const rawDb = getRawDb();
    drizzleDb = drizzle(rawDb, { schema });
  }
  return drizzleDb;
}
