"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition, useEffect } from "react";
import type { Student } from "@/types/student";
import type { Course } from "@/types/course";
import { 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  GraduationCap, 
  BookOpen, 
  Printer, 
  Loader2, 
  Save, 
  X, 
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type EditableStudent = Pick<
  Student,
  "id" | "name" | "email" | "age" | "department"
>;

type FormState = Omit<EditableStudent, "id">;

type StudentsTableProps = {
  currentPage: number;
  limit: number;
  students: Student[];
  totalPages: number;
  totalStudents: number;
};

export function StudentsTable({
  currentPage,
  limit,
  students,
  totalPages,
  totalStudents,
}: StudentsTableProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<Student[] | null>(null);
  
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [studentCourses, setStudentCourses] = useState<(Course & { enrollment_id: number })[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("");

  useEffect(() => {
    async function loadAllCourses() {
      try {
        const res = await fetch("/api/course?limit=100");
        if (res.ok) {
          const data = await res.json();
          setAllCourses(data);
        }
      } catch (err) {
        console.error("Failed to load courses for filter", err);
      }
    }
    loadAllCourses();
  }, []);

  async function openEnrollmentModal(student: Student) {
    setActiveStudent(student);
    setModalLoading(true);
    setModalError(null);
    setSelectedCourseId("");
    setStudentCourses([]);
    setAvailableCourses([]);

    try {
      const coursesRes = await fetch(`/api/students/${student.id}/courses`);
      if (!coursesRes.ok) throw new Error("Failed to fetch student courses");
      const coursesData = await coursesRes.json();
      const currentCourses = coursesData.success ? coursesData.data : [];
      setStudentCourses(currentCourses);

      const allCoursesRes = await fetch("/api/course?limit=100");
      if (!allCoursesRes.ok) throw new Error("Failed to fetch all courses");
      const allCourses = await allCoursesRes.json() as Course[];

      const currentCourseIds = new Set(currentCourses.map((c: any) => c.id));
      const unenrolled = allCourses.filter((course) => !currentCourseIds.has(course.id));
      setAvailableCourses(unenrolled);
      if (unenrolled.length > 0) {
        setSelectedCourseId(String(unenrolled[0].id));
      }
    } catch (err: any) {
      setModalError(err.message || "An error occurred while loading courses.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleCourseFilterChange(courseId: string) {
    setSelectedCourseFilter(courseId);
    setSearchQuery("");
    setError(null);
    setEditingId(null);
    setIsSearching(true);

    if (!courseId) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    try {
      const response = await fetch(`/api/students?courseId=${courseId}`);
      if (!response.ok) {
        throw new Error("Could not filter students. Try again.");
      }
      const results = (await response.json()) as Student[];
      setSearchResults(results);
      setIsSearching(false);
    } catch (err: any) {
      setError(err.message || "Could not filter students.");
      setIsSearching(false);
    }
  }

  function exportCSV() {
    if (displayedStudents.length === 0) return;
    const headers = ["ID", "Name", "Email", "Age", "Department", "Created At"];
    const rows = displayedStudents.map((student) =>
      [
        student.id,
        student.name,
        student.email,
        student.age,
        student.department,
        student.created_at,
      ]
        .map((value) => {
          const str = String(value ?? "");
          if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function printTranscript() {
    if (!activeStudent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCredits = studentCourses.reduce((sum, c) => sum + c.credits, 0);

    const html = `
      <html>
        <head>
          <title>Academic Transcript - ${activeStudent.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #18181b; }
            .header { border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
            .meta { margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { border: 1px solid #e4e4e7; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f4f4f5; font-weight: bold; }
            .summary { margin-top: 30px; font-size: 16px; font-weight: bold; border-top: 2px solid #18181b; padding-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Academic Transcript</div>
            <div class="meta">
              <div><strong>Student Name:</strong> ${activeStudent.name}</div>
              <div><strong>Email:</strong> ${activeStudent.email}</div>
              <div><strong>Department:</strong> ${activeStudent.department}</div>
              <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <h3>Enrolled Courses</h3>
          ${studentCourses.length === 0 ? `
            <p style="font-style: italic; color: #71717a;">No course enrollments found for this student.</p>
          ` : `
            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Course Code</th>
                  <th style="width: 55%;">Course Name</th>
                  <th style="width: 20%;">Credits</th>
                </tr>
              </thead>
              <tbody>
                ${studentCourses.map(course => `
                  <tr>
                    <td><strong>${course.code}</strong></td>
                    <td>${course.name}</td>
                    <td>${course.credits}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `}
          <div class="summary">
            Total Courses: ${studentCourses.length} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Total Credits: ${totalCredits}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function enrollInCourse(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourseId || !activeStudent) return;
    setModalError(null);

    try {
      const response = await fetch("/api/enrollment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: activeStudent.id,
          course_id: Number(selectedCourseId),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enroll student.");
      }

      await openEnrollmentModal(activeStudent);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setModalError(err.message || "Could not enroll student.");
    }
  }

  async function unenrollFromCourse(enrollmentId: number) {
    if (!activeStudent) return;
    const shouldDelete = window.confirm("Are you sure you want to unenroll the student from this course?");
    if (!shouldDelete) return;

    setModalError(null);

    try {
      const response = await fetch(`/api/enrollment/${enrollmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll student.");
      }

      await openEnrollmentModal(activeStudent);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setModalError(err.message || "Could not unenroll student.");
    }
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    age: 0,
    department: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const displayedStudents = searchResults ?? students;
  const isShowingSearchResults = searchResults !== null;
  const pageStart =
    totalStudents === 0 ? 0 : Math.min((currentPage - 1) * limit + 1, totalStudents);
  const pageEnd = Math.min(currentPage * limit, totalStudents);

  function getPageHref(page: number) {
    return `/students?page=${page}&limit=${limit}`;
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      age: student.age,
      department: student.department,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveStudent(id: number) {
    setError(null);

    const response = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setError("Could not update student. Check the details and try again.");
      return;
    }

    setEditingId(null);
    setSearchResults((current) =>
      current
        ? current.map((student) =>
            student.id === id ? { ...student, ...form } : student,
          )
        : current,
    );
    startTransition(() => {
      router.refresh();
    });
  }

  async function deleteStudent(id: number, name: string) {
    const shouldDelete = window.confirm(`Delete ${name}?`);

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setDeletingId(id);

    const response = await fetch(`/api/students/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Could not delete student. Try again.");
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    setSearchResults((current) =>
      current ? current.filter((student) => student.id !== id) : current,
    );
    setDeletingId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function searchStudents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEditingId(null);
    setIsSearching(true);

    const query = searchQuery.trim();
    const response = await fetch(
      query
        ? `/api/students?query=${encodeURIComponent(query)}`
        : `/api/students?page=${currentPage}&limit=${limit}`,
    );

    if (!response.ok) {
      setError("Could not search students. Try again.");
      setIsSearching(false);
      return;
    }

    const results = (await response.json()) as Student[];
    setSearchResults(results);
    setIsSearching(false);
  }

  function clearSearch() {
    setSearchQuery("");
    setSelectedCourseFilter("");
    setSearchResults(null);
    setError(null);
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtering and Query Commands Header */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-colors duration-350">
        <form
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={searchStudents}
        >
          <div className="relative flex-1">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 block mb-1.5 font-medium">Query Input</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 text-sm text-zinc-850 dark:text-zinc-150 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
                placeholder="Search name, email, or department..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-64">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 block mb-1.5 font-medium flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              Filter by Course
            </span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
            >
              <option value="">All Courses</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              className="h-10 rounded-md bg-zinc-950 dark:bg-white dark:text-zinc-950 px-5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-400 flex items-center gap-1.5 shadow-sm"
              disabled={isSearching}
              type="submit"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Search</span>
            </button>
            <button
              className="h-10 rounded-md border border-zinc-200 dark:border-zinc-850 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              type="button"
              onClick={clearSearch}
            >
              Clear
            </button>
            <button
              className="h-10 rounded-md border border-zinc-200 dark:border-zinc-850 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-400 flex items-center gap-1.5"
              type="button"
              onClick={exportCSV}
              disabled={displayedStudents.length === 0}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table Body */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-colors duration-355">
        {error && (
          <div className="border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-5 py-4 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {displayedStudents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <GraduationCap className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">No students found</h2>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Try a different query or add a new student record to initialize.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">ID</th>
                  <th className="px-6 py-3.5 font-semibold">Name</th>
                  <th className="px-6 py-3.5 font-semibold">Email</th>
                  <th className="px-6 py-3.5 font-semibold">Age</th>
                  <th className="px-6 py-3.5 font-semibold">Department</th>
                  <th className="px-6 py-3.5 font-semibold">Created</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.04 }
                  }
                }}
                initial="hidden"
                animate="show"
                className="divide-y divide-zinc-150 dark:divide-zinc-800/60"
              >
                {displayedStudents.map((student) => {
                  const isEditing = editingId === student.id;

                  return (
                    <motion.tr 
                      key={student.id} 
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                        #{student.id}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500"
                            value={form.name}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-650 dark:text-zinc-450">
                        {isEditing ? (
                          <input
                            className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500"
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          student.email
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-650 dark:text-zinc-450 font-medium">
                        {isEditing ? (
                          <input
                            className="h-9 w-20 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500"
                            min={1}
                            type="number"
                            value={form.age}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                age: Number(event.target.value),
                              }))
                            }
                          />
                        ) : (
                          student.age
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-650 dark:text-zinc-450">
                        {isEditing ? (
                          <input
                            className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500"
                            value={form.department}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                department: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200/10">
                            {student.department}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                                disabled={isPending}
                                type="button"
                                onClick={() => saveStudent(student.id)}
                              >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span>Save</span>
                              </button>
                              <button
                                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1"
                                disabled={isPending}
                                type="button"
                                onClick={cancelEdit}
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Cancel</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1"
                                disabled={deletingId === student.id}
                                type="button"
                                onClick={() => startEdit(student)}
                              >
                                <Edit3 className="h-3.5 w-3.5 text-zinc-450" />
                                <span>Edit</span>
                              </button>
                              <button
                                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1"
                                disabled={deletingId === student.id}
                                type="button"
                                onClick={() => openEnrollmentModal(student)}
                              >
                                <BookOpen className="h-3.5 w-3.5 text-zinc-455" />
                                <span>Courses</span>
                              </button>
                              <button
                                className="h-8 rounded-md border border-red-150 dark:border-red-950 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-750 transition-all flex items-center gap-1"
                                disabled={deletingId === student.id}
                                type="button"
                                onClick={() =>
                                  deleteStudent(student.id, student.name)
                                }
                              >
                                {deletingId === student.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                )}
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!isShowingSearchResults && (
        <div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between px-1">
          <p className="text-xs font-medium">
            Showing <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{pageStart}-{pageEnd}</strong> of <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{totalStudents}</strong> student records
          </p>
          <div className="flex items-center gap-3">
            {currentPage > 1 ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1"
                href={getPageHref(currentPage - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 flex items-center gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </span>
            )}
            <span className="text-xs font-medium dark:text-zinc-400">
              Page <strong className="text-zinc-900 dark:text-white font-semibold">{currentPage}</strong> of <strong className="text-zinc-900 dark:text-white font-semibold">{totalPages}</strong>
            </span>
            {currentPage < totalPages ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1"
                href={getPageHref(currentPage + 1)}
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 flex items-center gap-1">
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Slide / Spring Dialog Overlay for Course Enrollment */}
      <AnimatePresence>
        {activeStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.38 }}
              className="relative w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl text-zinc-955 dark:text-zinc-50 transition-colors"
            >
              <button
                onClick={() => setActiveStudent(null)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                <span>Course Enrollment</span>
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                Manage enrolled courses and transcripts for <strong className="text-zinc-905 dark:text-zinc-100 font-semibold">{activeStudent.name}</strong>
              </p>

              {modalError && (
                <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Enrolled Courses Block */}
              <div className="mt-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Enrolled Courses ({studentCourses.length})</h3>
                  {studentCourses.length > 0 && (
                    <button
                      onClick={printTranscript}
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1 shadow-sm bg-white dark:bg-zinc-900"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Transcript</span>
                    </button>
                  )}
                </div>

                {modalLoading ? (
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 italic py-3 flex items-center gap-1.5 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    <span>Loading student records...</span>
                  </p>
                ) : studentCourses.length === 0 ? (
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 italic py-6 text-center">
                    This student is not enrolled in any courses yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-48 overflow-y-auto border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg bg-zinc-50/20 dark:bg-zinc-950/20">
                    {studentCourses.map((course) => (
                      <li key={course.id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-850 dark:text-zinc-150">{course.name}</span>
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded font-bold">{course.code}</span>
                          <span className="text-[10px] text-zinc-400">{course.credits} cr</span>
                        </div>
                        <button
                          onClick={() => unenrollFromCourse(course.enrollment_id)}
                          className="text-[10px] font-bold text-red-650 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add Enrollment Block */}
              {!modalLoading && (
                <form onSubmit={enrollInCourse} className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Enroll in a new course</h3>
                  {availableCourses.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">
                      Student is already enrolled in all catalog courses.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        required
                        className="h-10 flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500"
                      >
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name} ({course.credits} Credits)
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={!selectedCourseId}
                        className="h-10 rounded-md bg-zinc-950 dark:bg-white dark:text-zinc-950 px-4 text-xs font-semibold text-white transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-350"
                      >
                        Enroll
                      </button>
                    </div>
                  )}
                </form>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveStudent(null)}
                  className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-semibold text-zinc-650 dark:text-zinc-305 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-sm bg-white dark:bg-zinc-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
