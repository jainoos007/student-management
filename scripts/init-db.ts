import { execSync } from "child_process";

try {
  console.log("Initializing database schema using Drizzle Kit...");
  execSync("npx drizzle-kit push", { stdio: "inherit" });
  console.log("Database initialized successfully.");
} catch (error) {
  console.error("Database initialization failed:", error);
  process.exit(1);
}
