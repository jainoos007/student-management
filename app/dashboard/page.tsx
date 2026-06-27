import Link from "next/link";
import { connection } from "next/server";
import {
  getAverageAge,
  getDepartmentStats,
  getOldestStudent,
  getTotalStudents,
} from "@/lib/student";
import { getTotalCourses, getAverageEnrollmentsPerStudent } from "@/lib/course";

export const metadata = {
  title: "Dashboard",
  description: "Student management dashboard",
};

export default async function DashboardPage() {
  await connection();

  const totalStudents = getTotalStudents();
  const averageAge = getAverageAge();
  const oldestStudent = getOldestStudent();
  const departmentStats = getDepartmentStats();
  const totalCourses = getTotalCourses();
  const averageEnrollments = getAverageEnrollmentsPerStudent();

  const maxDepartmentCount = Math.max(
    1,
    ...departmentStats.map((department) => department.count),
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Student Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/courses"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Manage courses
            </Link>
            <Link
              href="/students"
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Manage students
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Total students</p>
            <p className="mt-2 text-3xl font-semibold">{totalStudents}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Average age</p>
            <p className="mt-2 text-3xl font-semibold">
              {totalStudents === 0 ? "N/A" : averageAge.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Departments</p>
            <p className="mt-2 text-3xl font-semibold">
              {departmentStats.length}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Total courses</p>
            <p className="mt-2 text-3xl font-semibold">{totalCourses}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Avg Enrollments</p>
            <p className="mt-2 text-3xl font-semibold">
              {totalStudents === 0 ? "N/A" : averageEnrollments.toFixed(1)}
            </p>
          </div>
        </section>


        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">Oldest student</h2>
            </div>
            {oldestStudent ? (
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-2xl font-semibold">
                    {oldestStudent.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {oldestStudent.email}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Age</p>
                    <p className="mt-1 text-xl font-semibold">
                      {oldestStudent.age}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Department</p>
                    <p className="mt-1 text-xl font-semibold">
                      {oldestStudent.department}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-zinc-500">
                No student records are available yet.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">
                Department distribution
              </h2>
            </div>
            {departmentStats.length === 0 ? (
              <div className="p-5 text-sm text-zinc-500">
                Add students to see department totals.
              </div>
            ) : (
              <div className="space-y-4 p-5">
                {departmentStats.map((department) => {
                  const width = Math.round(
                    (department.count / maxDepartmentCount) * 100,
                  );

                  return (
                    <div key={department.department}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium">
                          {department.department}
                        </span>
                        <span className="text-zinc-500">
                          {department.count}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-zinc-950"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
