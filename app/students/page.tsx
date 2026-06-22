import { connection } from "next/server";
import { getStudents } from "@/lib/student";
import { StudentsTable } from "./StudentsTable";

export const metadata = {
  title: "Students",
  description: "Student directory",
};

export default async function StudentsPage() {
  await connection();

  const students = getStudents();
  const departmentCount = new Set(students.map((student) => student.department))
    .size;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Student Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Students
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Total students</p>
              <p className="mt-1 text-2xl font-semibold">{students.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Departments</p>
              <p className="mt-1 text-2xl font-semibold">{departmentCount}</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <h2 className="text-lg font-semibold">No students found</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Add students to the database to see them listed here.
              </p>
            </div>
          ) : (
            <StudentsTable students={students} />
          )}
        </section>
      </div>
    </main>
  );
}
