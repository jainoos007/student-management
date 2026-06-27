import Link from "next/link";
import { connection } from "next/server";
import { getStudents } from "@/lib/student";

export default async function Home() {
  await connection();

  const students = getStudents();
  const departmentCount = new Set(students.map((student) => student.department))
    .size;
  const averageAge =
    students.length === 0
      ? 0
      : Math.round(
          students.reduce((total, student) => total + student.age, 0) /
            students.length,
        );
  const recentStudents = students.slice(0, 4);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Student Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-5xl">
              Manage student records from one clean dashboard.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Review student totals, department coverage, and recently added
              records before opening the full directory.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Open dashboard
            </Link>
            <Link
              href="/students"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              View students
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              View courses
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Total students</p>
            <p className="mt-2 text-3xl font-semibold">{students.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Departments</p>
            <p className="mt-2 text-3xl font-semibold">{departmentCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Average age</p>
            <p className="mt-2 text-3xl font-semibold">
              {students.length === 0 ? "N/A" : averageAge}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="text-base font-semibold">Recent students</h2>
            <Link
              href="/students"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              Open directory
            </Link>
          </div>
          {recentStudents.length === 0 ? (
            <div className="px-5 py-10 text-sm text-zinc-500">
              No student records are available yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1.5fr_2fr_1fr]"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      ID {student.id}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-600">{student.email}</p>
                  <p className="text-sm text-zinc-600">{student.department}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
