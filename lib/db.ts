import Database from "better-sqlite3";
import { Student } from "@types/student";

const db = new Database("database/students.db");

export default db;
