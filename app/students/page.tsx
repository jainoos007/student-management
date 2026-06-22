import { connection } from "next/server";
import { getDepartmentStats, getStudents, getTotalStudents } from "@/lib/student";
import { StudentCreateForm } from "./StudentCreateForm";
import { StudentsTable } from "./StudentsTable";

export const metadata = {
  title: "Students",
  description: "Student directory",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositiveNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; limit?: string | string[] }>;
}) {
  await connection();

  const params = await searchParams;
  const limit = getPositiveNumber(params.limit, 10);
  const totalStudents = getTotalStudents();
  const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
  const page = Math.min(getPositiveNumber(params.page, 1), totalPages);
  const students = getStudents(page, limit);
  const departmentCount = getDepartmentStats().length;

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
              <p className="mt-1 text-2xl font-semibold">{totalStudents}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Departments</p>
              <p className="mt-1 text-2xl font-semibold">{departmentCount}</p>
            </div>
          </div>
        </header>

        <StudentCreateForm />

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <StudentsTable
            currentPage={page}
            limit={limit}
            students={students}
            totalPages={totalPages}
            totalStudents={totalStudents}
          />
        </section>
      </div>
    </main>
  );
}
