import { getDb } from "./db";
import type { Student } from "@/types/student";

export function getStudents(): Student[] {
  const db = getDb();
  return db.prepare("SELECT * FROM students").all() as Student[];
}
