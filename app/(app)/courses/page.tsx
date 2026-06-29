import { connection } from "next/server";
import { getCourses, getTotalCourses, getTotalCredits } from "@/lib/db/queries/course";
import { CourseCreateForm } from "./CourseCreateForm";
import { CoursesTable } from "./CoursesTable";
import { BookOpen, Award } from "lucide-react";

export const metadata = {
  title: "Courses - EduSuite",
  description: "Academic course directory and catalog listings",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositiveNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; limit?: string | string[] }>;
}) {
  await connection();

  const params = await searchParams;
  const limit = getPositiveNumber(params.limit, 10);
  const totalCourses = getTotalCourses();
  const totalCredits = getTotalCredits();
  const totalPages = Math.max(1, Math.ceil(totalCourses / limit));
  const page = Math.min(getPositiveNumber(params.page, 1), totalPages);
  const courses = getCourses(page, limit);

  return (
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Curriculum Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Course Catalog
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Active Courses</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{totalCourses}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Total Credits</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{totalCredits}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Directory Listings Table */}
        <section>
          <CoursesTable
            currentPage={page}
            limit={limit}
            courses={courses}
            totalPages={totalPages}
            totalCourses={totalCourses}
          />
        </section>
      </div>
    </main>
  );
}

