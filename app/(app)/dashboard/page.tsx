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
  Building2, 
  Award, 
  CalendarDays,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import DashboardAuditFeed from "@/components/DashboardAuditFeed";

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
  const popularCourses = getPopularCourses(5);

  const maxEnrollmentCount = Math.max(
    1,
    ...popularCourses.map((course) => course.enrollment_count),
  );

  const departmentColors = [
    { bg: "bg-indigo-500", text: "text-indigo-500", hex: "#6366f1" },
    { bg: "bg-purple-500", text: "text-purple-500", hex: "#a855f7" },
    { bg: "bg-amber-500", text: "text-amber-500", hex: "#f59e0b" },
    { bg: "bg-emerald-500", text: "text-emerald-500", hex: "#10b981" },
    { bg: "bg-rose-500", text: "text-rose-500", hex: "#f43f5e" },
    { bg: "bg-blue-500", text: "text-blue-500", hex: "#3b82f6" },
  ];

  // Calculate donut slices for department distribution
  let cumulativeLength = 0;
  const donutSlices = departmentStats.map((dept, index) => {
    const percentage = totalStudents === 0 ? 0 : dept.count / totalStudents;
    const strokeLength = percentage * 314.16;
    const strokeOffset = -cumulativeLength;
    cumulativeLength += strokeLength;
    const colorInfo = departmentColors[index % departmentColors.length];
    return {
      ...dept,
      percentage,
      strokeLength,
      strokeOffset,
      color: colorInfo,
    };
  });

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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Students</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Average Age</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Departments</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Courses</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Avg Enrollments</span>
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
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Left Column: Visual Analytics (Donut Chart & Horizontal Bars) */}
          <div className="flex flex-col gap-6">
            
            {/* Department Distribution (Radial SVG Donut Chart) */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-5 flex flex-col justify-between">
              <div>
                <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-zinc-450 dark:text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Department Distribution
                  </h2>
                </div>
                {departmentStats.length === 0 ? (
                  <div className="py-12 text-sm text-zinc-450 dark:text-zinc-500 text-center italic">
                    Register students to activate department metrics.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                    {/* SVG Donut Chart wrapper */}
                    <div className="relative h-32 w-32 shrink-0">
                      <svg viewBox="0 0 120 120" className="h-full w-full transform -rotate-95">
                        {/* Background track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          className="stroke-zinc-100 dark:stroke-zinc-800/60"
                          strokeWidth="10"
                        />
                        {/* Slices */}
                        {donutSlices.map((slice, i) => (
                          <circle
                            key={i}
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke={slice.color.hex}
                            strokeWidth="10"
                            strokeDasharray={`${slice.strokeLength} 314.16`}
                            strokeDashoffset={slice.strokeOffset}
                            className="transition-all duration-500"
                          />
                        ))}
                      </svg>
                      {/* Centered text markup */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                          {totalStudents}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-bold mt-1">
                          Total
                        </span>
                      </div>
                    </div>

                    {/* Chart Legends */}
                    <div className="flex-1 space-y-2.5 w-full">
                      {donutSlices.map((slice, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${slice.color.bg}`} />
                            <span className="font-medium text-zinc-650 dark:text-zinc-350">
                              {slice.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-zinc-850 dark:text-zinc-150">
                              {slice.count}
                            </span>
                            <span className="text-zinc-400 text-[10px] w-10 text-right">
                              {Math.round(slice.percentage * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Popular Courses (Horizontal Bar Chart) */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-5">
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Popular Courses Overview</h2>
              </div>
              {popularCourses.length === 0 ? (
                <div className="py-12 text-sm text-zinc-450 dark:text-zinc-500 text-center italic">
                  No courses are in catalog yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {popularCourses.map((course) => {
                    const width = Math.round(
                      (course.enrollment_count / maxEnrollmentCount) * 100,
                    );

                    return (
                      <div key={course.id} className="group/item">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-semibold text-zinc-855 dark:text-zinc-200 flex items-center gap-2">
                            <span className="text-zinc-900 dark:text-white">{course.name}</span>
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded font-bold">{course.code}</span>
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-[10px] shrink-0 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800/50">
                            {course.enrollment_count} student{course.enrollment_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 transition-all duration-500"
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

          {/* Right Column: Live Audit Trails Feed & Featured Record */}
          <div className="flex flex-col gap-6">
            
            {/* Live Activity logs stream component */}
            <DashboardAuditFeed />

            {/* Featured Oldest Record Widget */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Featured Records - Oldest Student</h2>
              </div>
              {oldestStudent ? (
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {oldestStudent.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-zinc-450 dark:text-zinc-500">
                      {oldestStudent.email}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3.5">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wide">Age Metric</p>
                      <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                        {oldestStudent.age} <span className="text-xs font-normal text-zinc-400">years old</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3.5">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wide">Department</p>
                      <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white truncate">
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
          </div>
        </section>
      </div>
    </main>
  );
}
