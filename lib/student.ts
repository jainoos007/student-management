import db from "./db";
import { Student } from "@/types/student";

export function getStudents(): Student[] {
  return db.prepare("SELECT * FROM students").all() as Student[];
}
