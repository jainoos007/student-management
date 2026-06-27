import Link from "next/link";
import { connection } from "next/server";
import {
  getAverageAge,
  getDepartmentStats,
  getOldestStudent,
  getTotalStudents,
} from "@/lib/student";
import { getTotalCourses, getAverageEnrollmentsPerStudent, getPopularCourses } from "@/lib/course";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Building2, 
  Award, 
  CalendarDays,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";

export const metadata = {
  title: "Dashboard - EduSuite",
  description: "Administrative insights and statistics overview",
};

export default async function DashboardPage() {
  await connection();

  const totalStudents = getTotalStudents();
  const averageAge = getAverageAge();
  const oldestStudent = getOldestStudent();
  const departmentStats = getDepartmentStats();
  const totalCourses = getTotalCourses();
  const averageEnrollments = getAverageEnrollmentsPerStudent();
  const popularCourses = getPopularCourses(3);

  const maxDepartmentCount = Math.max(
    1,
    ...departmentStats.map((department) => department.count),
  );

  const maxEnrollmentCount = Math.max(
    1,
    ...popularCourses.map((course) => course.enrollment_count),
  );

  return (
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Overview Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              System Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white shadow-sm"
            >
              Manage Courses
            </Link>
            <Link
              href="/students"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 px-4 text-sm font-medium text-white dark:text-zinc-950 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Manage Students</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1 */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Total Students</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">{totalStudents}</p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Average Age</span>
              <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">
                {totalStudents === 0 ? "N/A" : averageAge.toFixed(1)}
              </p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Departments</span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">{departmentStats.length}</p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Total Courses</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">{totalCourses}</p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Avg Enrollments</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">
                {totalStudents === 0 ? "N/A" : averageEnrollments.toFixed(1)}
              </p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>
        </section>

        {/* Dynamic Analytics Panels */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
          
          {/* Left Column: Oldest Student & Popular Courses */}
          <div className="flex flex-col gap-6">
            
            {/* Oldest Student Widget */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Featured Records - Oldest Student</h2>
              </div>
              {oldestStudent ? (
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {oldestStudent.name}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {oldestStudent.email}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Age Metric</p>
                      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                        {oldestStudent.age} <span className="text-xs font-normal text-zinc-400">years old</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Department Division</p>
                      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                        {oldestStudent.department}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-zinc-400 dark:text-zinc-500 text-center italic">
                  No student records are available yet.
                </div>
              )}
            </div>

            {/* Popular Courses Widget */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Popular Courses</h2>
              </div>
              {popularCourses.length === 0 ? (
                <div className="p-6 text-sm text-zinc-400 dark:text-zinc-500 text-center italic">
                  No courses are available yet.
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-5">
                  {popularCourses.map((course) => {
                    const width = Math.round(
                      (course.enrollment_count / maxEnrollmentCount) * 100,
                    );

                    return (
                      <div key={course.id} className="group/item">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <span className="text-zinc-900 dark:text-white">{course.name}</span>
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-semibold">{course.code}</span>
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-xs shrink-0 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800 group-hover/item:text-zinc-800 dark:group-hover/item:text-zinc-200 transition-colors">
                            {course.enrollment_count} student{course.enrollment_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/50">
                          <div
                            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Department distribution */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Department Distribution
                </h2>
              </div>
              {departmentStats.length === 0 ? (
                <div className="p-6 text-sm text-zinc-400 dark:text-zinc-500 text-center italic">
                  Add students to see department totals.
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-5">
                  {departmentStats.map((department) => {
                    const width = Math.round(
                      (department.count / maxDepartmentCount) * 100,
                    );

                    return (
                      <div key={department.department} className="group/dept">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {department.department}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold font-mono bg-zinc-50 dark:bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                            {department.count}
                          </span>
                        </div>
                        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/50">
                          <div
                            className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-850 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
              <UserCheck className="h-4 w-4 text-zinc-400" />
              <span>Real-time administrative stats active</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

