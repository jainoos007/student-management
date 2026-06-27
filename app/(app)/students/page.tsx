import { connection } from "next/server";
import { getDepartmentStats, getStudents, getTotalStudents } from "@/lib/student";
import { StudentsTable } from "./StudentsTable";
import { Users, Building2 } from "lucide-react";

export const metadata = {
  title: "Students - EduSuite",
  description: "Administrative directory of student records",
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
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Registrar Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Student Directory
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Total Enrolled</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{totalStudents}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Departments</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{departmentCount}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Directory Listings Table */}
        <section>
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

