import Database from "better-sqlite3";

let db: Database.Database | null = null;

export function getDb() {
  db ??= new Database("database/students.db");
  return db;
}
