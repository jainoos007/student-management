import { connection } from "next/server";
import { getCourses, getTotalCourses } from "@/lib/course";
import { CourseCreateForm } from "./CourseCreateForm";
import { CoursesTable } from "./CoursesTable";
import Link from "next/link";

export const metadata = {
  title: "Courses",
  description: "Course catalog and directory",
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
  const totalPages = Math.max(1, Math.ceil(totalCourses / limit));
  const page = Math.min(getPositiveNumber(params.page, 1), totalPages);
  const courses = getCourses(page, limit);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
                Dashboard
              </Link>
              <span className="text-zinc-400">/</span>
              <span className="text-sm font-medium text-zinc-700">Courses</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Course Catalog
            </h1>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:min-w-44">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Total Courses</p>
              <p className="mt-1 text-2xl font-semibold">{totalCourses}</p>
            </div>
          </div>
        </header>

        <CourseCreateForm />

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
