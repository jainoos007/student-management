import Link from "next/link";
import { connection } from "next/server";
import { getStudents } from "@/lib/student";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Zap,
  Globe2
} from "lucide-react";

export default async function Home() {
  await connection();

  const students = getStudents();
  const departmentCount = new Set(students.map((student) => student.department)).size;
  const averageAge =
    students.length === 0
      ? 0
      : Math.round(
          students.reduce((total, student) => total + student.age, 0) /
            students.length,
        );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-zinc-900 dark:text-white" />
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">EduSuite</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-550 dark:text-zinc-400">
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Overview</Link>
            <Link href="/students" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Students</Link>
            <Link href="/courses" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Courses</Link>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 px-4 text-xs font-semibold text-white dark:text-zinc-950 transition-all shadow-sm flex items-center gap-1"
          >
            <span>Launch App</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 dark:bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>EduSuite V1.2 SaaS Release</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            The modern administrative core for <span className="bg-gradient-to-r from-indigo-550 to-purple-600 bg-clip-text text-transparent">academic operations</span>.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            Consolidate student registry records, automate course enrollment, audit metrics logs, and run detailed reports in real-time.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 px-6 text-sm font-semibold text-white dark:text-zinc-950 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/students"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-sm"
            >
              Student Registry
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Enrolled</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{students.length}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">Students active across registry</p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Departments Covered</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{departmentCount}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">Active academic divisions</p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Average Registry Age</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{students.length === 0 ? "N/A" : `${averageAge} yrs`}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">Average age of records</p>
          </div>
        </div>
      </section>

      {/* Feature Selling Cards Grid */}
      <section className="px-6 py-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-8">Features built for production</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Box 1 */}
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 p-6">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center mb-4">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Admin Visualizations</h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed">
              Query aggregate metrics, track course popularities, and review department distribution curves instantly.
            </p>
          </div>
          {/* Box 2 */}
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 p-6">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Structured Directory</h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed">
              Add, search, filter, and inline-edit student profiles with strict credit validations and automatic data refreshes.
            </p>
          </div>
          {/* Box 3 */}
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 p-6">
            <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Interactive Enrollment</h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed">
              Enroll students in catalog courses with schedule check guards, delete old relations, and print elegant academic transcripts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200/40 dark:border-zinc-800/40 py-6 px-6 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-950">
        <p>© {new Date().getFullYear()} EduSuite Inc. All rights reserved. Professional SaaS Framework.</p>
      </footer>
    </div>
  );
}
