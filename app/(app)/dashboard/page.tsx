import Link from "next/link";
import { connection } from "next/server";
import {
  getAverageAge,
  getDepartmentStats,
  getOldestStudent,
  getTotalStudents,
  getAverageGPA,
} from "@/lib/db/queries/student";
import { getTotalCourses, getAverageEnrollmentsPerStudent, getPopularCourses } from "@/lib/db/queries/course";
import { getEnrollmentTrends } from "@/lib/db/queries/enrollment";
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
import DashboardCharts from "@/components/DashboardCharts";

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
  const enrollmentTrends = getEnrollmentTrends();
  const averageGPA = getAverageGPA();

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Link
              href="/courses"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-zinc-650 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white shadow-sm w-full sm:w-auto"
            >
              Manage Courses
            </Link>
            <Link
              href="/students"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 px-4 text-sm font-medium text-white dark:text-zinc-950 transition-all shadow-md flex items-center justify-center sm:justify-start gap-1.5 w-full sm:w-auto"
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

          {/* Card 2 (Formerly Card 3): Departments */}
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

          {/* Card 3 (Formerly Card 4): Total Courses */}
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

          {/* Card 4 (Formerly Card 5): Avg Enrollments */}
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

          {/* Card 5 (Formerly Card 6): Average GPA */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Average GPA</span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">
                {totalStudents === 0 ? "N/A" : averageGPA.toFixed(2)}
              </p>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350" />
            </div>
          </div>
        </section>

        {/* Dynamic Analytics Panels */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Left Column: Interactive Visual Analytics Charts */}
          <div className="flex flex-col gap-6">
            <DashboardCharts 
              departmentStats={departmentStats}
              popularCourses={popularCourses}
              enrollmentTrends={enrollmentTrends}
            />
          </div>

          {/* Right Column: Live Audit Trails Feed & Featured Record */}
          <div className="flex flex-col gap-6">
            
            {/* Live Activity logs stream component */}
            <DashboardAuditFeed />

            {/* Featured Oldest Record Widget */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-zinc-450 dark:text-zinc-400" />
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
