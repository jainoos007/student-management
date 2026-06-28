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
  X, 
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion } from "framer-motion";
import { StudentCreateForm } from "./StudentCreateForm";
import { toast } from "sonner";

// Official Shadcn Components
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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
  const [studentCourses, setStudentCourses] = useState<(Course & { enrollment_id: number; grade?: string | null })[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all-courses");

  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all-departments");

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: number; name: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [unenrollConfirmOpen, setUnenrollConfirmOpen] = useState(false);
  const [enrollmentToUnenroll, setEnrollmentToUnenroll] = useState<{ id: number; courseName: string } | null>(null);

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
    async function loadDepartments() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments for filter", err);
      }
    }
    loadAllCourses();
    loadDepartments();
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

  // Load search results dynamically based on combined filters (with 200ms debounce)
  useEffect(() => {
    const isCourseActive = selectedCourseFilter !== "all-courses";
    const isDeptActive = selectedDeptFilter !== "all-departments";
    const isQueryActive = searchQuery.trim().length > 0;

    if (!isCourseActive && !isDeptActive && !isQueryActive) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setEditingId(null);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (isQueryActive) params.append("query", searchQuery.trim());
        if (isCourseActive) params.append("courseId", selectedCourseFilter);
        if (isDeptActive) params.append("department", selectedDeptFilter);

        const response = await fetch(`/api/students?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Could not filter students. Try again.");
        }
        const data = await response.json();
        setSearchResults(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while filtering.");
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCourseFilter, selectedDeptFilter]);

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

    const gradePoints: Record<string, number> = {
      "A": 4.0,
      "B": 3.0,
      "C": 2.0,
      "D": 1.0,
      "F": 0.0
    };

    let totalPoints = 0;
    let gradedCredits = 0;
    for (const c of studentCourses) {
      if (c.grade && c.grade.toUpperCase() in gradePoints) {
        totalPoints += gradePoints[c.grade.toUpperCase()] * c.credits;
        gradedCredits += c.credits;
      }
    }
    const studentGpa = gradedCredits > 0 ? (totalPoints / gradedCredits).toFixed(2) : "N/A";

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
                  <th style="width: 20%;">Course Code</th>
                  <th style="width: 45%;">Course Name</th>
                  <th style="width: 15%;">Credits</th>
                  <th style="width: 20%;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${studentCourses.map(course => `
                  <tr>
                    <td><strong>${course.code}</strong></td>
                    <td>${course.name}</td>
                    <td>${course.credits}</td>
                    <td>${course.grade ? course.grade.toUpperCase() : `<span style="color: #71717a; font-style: italic;">In Progress</span>`}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `}
          <div class="summary">
            Total Courses: ${studentCourses.length} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            Total Credits: ${totalCredits} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            Cumulative GPA: ${studentGpa}
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

  async function handleUpdateGrade(enrollmentId: number, grade: string) {
    try {
      const response = await fetch(`/api/enrollment/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: grade === "IP" ? null : grade }),
      });
      
      if (!response.ok) {
        throw new Error("Could not update grade");
      }
      
      toast.success("Grade updated successfully");
      
      // Update studentCourses state so GPA updates immediately in UI
      setStudentCourses((prev) =>
        prev.map((c) =>
          c.enrollment_id === enrollmentId
            ? { ...c, grade: grade === "IP" ? null : grade }
            : c
        )
      );

      // Re-trigger router refresh so other lists reflect GPA
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update grade");
    }
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

      toast.success("Enrolled in course successfully");
      await openEnrollmentModal(activeStudent);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      const errorMsg = err.message || "Could not enroll student.";
      setModalError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function requestUnenroll(enrollmentId: number, courseName: string) {
    setEnrollmentToUnenroll({ id: enrollmentId, courseName });
    setUnenrollConfirmOpen(true);
  }

  async function handleConfirmUnenroll() {
    if (!enrollmentToUnenroll || !activeStudent) return;
    const { id, courseName } = enrollmentToUnenroll;
    setUnenrollConfirmOpen(false);
    setModalError(null);

    try {
      const response = await fetch(`/api/enrollment/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll student.");
      }

      toast.success(`Successfully unenrolled from "${courseName}"`);
      setEnrollmentToUnenroll(null);
      await openEnrollmentModal(activeStudent);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      const errorMsg = err.message || "Could not unenroll student.";
      setModalError(errorMsg);
      toast.error(errorMsg);
      setEnrollmentToUnenroll(null);
    }
  }

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
  const [sortColumn, setSortColumn] = useState<"name" | "email" | "age" | "created_at" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "name" | "email" | "age" | "created_at") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const displayedStudents = searchResults ?? students;

  const sortedStudents = [...displayedStudents].sort((a, b) => {
    if (!sortColumn) {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b.id - a.id;
    }

    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (sortColumn === "age") {
      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    if (sortColumn === "created_at") {
      const timeA = new Date(String(aVal)).getTime();
      const timeB = new Date(String(bVal)).getTime();
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    }

    const strA = String(aVal ?? "").toLowerCase();
    const strB = String(bVal ?? "").toLowerCase();
    if (strA < strB) return sortDirection === "asc" ? -1 : 1;
    if (strA > strB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const isShowingSearchResults = searchResults !== null;
  const pageStart =
    totalStudents === 0 ? 0 : Math.min((currentPage - 1) * limit + 1, totalStudents);
  const pageEnd = Math.min(currentPage * limit, totalStudents);

  function getPageHref(page: number) {
    return `/students?page=${page}&limit=${limit}`;
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setStudentToEdit(student);
    setForm({
      name: student.name,
      email: student.email,
      age: student.age,
      department: student.department,
    });
    setError(null);
    setEditDialogOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setStudentToEdit(null);
    setEditDialogOpen(false);
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
      const data = await response.json().catch(() => ({}));
      const errorMsg = data.message || "Could not update student. Check the details and try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    toast.success("Student details updated successfully");
    setEditingId(null);
    setStudentToEdit(null);
    setEditDialogOpen(false);
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

  function deleteStudent(id: number, name: string) {
    setStudentToDelete({ id, name });
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;
    const { id } = studentToDelete;

    setError(null);
    setDeletingId(id);
    setDeleteConfirmOpen(false);

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorMsg = "Could not delete student. Try again.";
        setError(errorMsg);
        toast.error(errorMsg);
        setDeletingId(null);
        setStudentToDelete(null);
        return;
      }

      toast.success(`Student "${studentToDelete?.name || ""}" deleted successfully`);
      if (editingId === id) {
        setEditingId(null);
      }

      setSearchResults((current) =>
        current ? current.filter((student) => student.id !== id) : current,
      );
      setDeletingId(null);
      setStudentToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError("Could not delete student. Try again.");
      setDeletingId(null);
      setStudentToDelete(null);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setSelectedCourseFilter("all-courses");
    setSelectedDeptFilter("all-departments");
    setSearchResults(null);
    setError(null);
    setEditingId(null);
  }

  const hasActiveFilters = selectedCourseFilter !== "all-courses" || selectedDeptFilter !== "all-departments";

  return (
    <div className="flex flex-col gap-6">
      {/* Filtering and Query Commands Header (No Card) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-zinc-150/40 dark:border-zinc-800/20 pb-4">
        {/* Left Search/Filters Action Group */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center w-full">
          <div className="relative flex-1 max-w-lg min-w-72">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                className="pl-9 pr-3 h-10 w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                placeholder="Search name, email, or department..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-52 shrink-0">
            <Select value={selectedCourseFilter} onValueChange={(val) => setSelectedCourseFilter(val ?? "all-courses")}>
              <SelectTrigger className="w-full h-10! border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                <SelectValue placeholder="All Courses">
                  {selectedCourseFilter === "all-courses"
                    ? "All Courses"
                    : allCourses.find((c) => String(c.id) === selectedCourseFilter)
                    ? (() => {
                        const c = allCourses.find((c) => String(c.id) === selectedCourseFilter)!;
                        return `${c.code} - ${c.name}`;
                      })()
                    : "All Courses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max!">
                <SelectItem value="all-courses">All Courses</SelectItem>
                {allCourses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:w-52 shrink-0">
            <Select value={selectedDeptFilter} onValueChange={(val) => setSelectedDeptFilter(val ?? "all-departments")}>
              <SelectTrigger className="w-full h-10! border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                <SelectValue placeholder="All Departments">
                  {selectedDeptFilter === "all-departments" ? "All Departments" : selectedDeptFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max!">
                <SelectItem value="all-departments">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="h-10 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5"
              type="button"
              onClick={exportCSV}
              disabled={displayedStudents.length === 0}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Right Corner Primary Action Group */}
        <div className="shrink-0 self-stretch sm:self-center flex items-center justify-end">
          <StudentCreateForm />
        </div>
      </div>

      {/* Filter Chips Display Area */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 -mt-4 px-1.5">
          {/* Chips on the left */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Active filters:</span>
            {selectedCourseFilter !== "all-courses" && (
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                <span className="font-semibold">Course:</span>
                <span>
                  {allCourses.find((c) => String(c.id) === selectedCourseFilter)?.code || selectedCourseFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCourseFilter("all-courses")}
                  className="hover:bg-indigo-100 dark:hover:bg-indigo-950/60 p-0.5 rounded-full text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 ml-1 transition-colors"
                  aria-label="Remove Course Filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedDeptFilter !== "all-departments" && (
              <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900/40">
                <span className="font-semibold">Department:</span>
                <span>{selectedDeptFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter("all-departments")}
                  className="hover:bg-purple-100 dark:hover:bg-purple-950/60 p-0.5 rounded-full text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 ml-1 transition-colors"
                  aria-label="Remove Department Filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold underline transition-colors ml-1"
            >
              Reset Filters
            </button>
          </div>

          {/* Counts on the right corner */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
            Found {displayedStudents.length} {displayedStudents.length === 1 ? "record" : "records"}
          </div>
        </div>
      )}

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
            <Table className="w-full min-w-[860px]">
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/30">
                <TableRow>
                  <TableHead className="px-6 py-3.5">Name</TableHead>
                  <TableHead className="px-6 py-3.5">Email</TableHead>
                  <TableHead
                    onClick={() => handleSort("age")}
                    className="px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Age</span>
                      {sortColumn === "age" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3 ml-0.5 text-zinc-900 dark:text-white" />
                        ) : (
                          <ArrowDown className="h-3 w-3 ml-0.5 text-zinc-900 dark:text-white" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 ml-0.5 opacity-40" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3.5">Department</TableHead>
                  <TableHead className="px-6 py-3.5">GPA</TableHead>
                  <TableHead
                    onClick={() => handleSort("created_at")}
                    className="px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      {sortColumn === "created_at" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3 ml-0.5 text-zinc-900 dark:text-white" />
                        ) : (
                          <ArrowDown className="h-3 w-3 ml-0.5 text-zinc-900 dark:text-white" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 ml-0.5 opacity-40" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((student) => {
                  return (
                    <TableRow key={student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <TableCell className="px-6 py-4">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-zinc-650 dark:text-zinc-450">
                        {student.email}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-zinc-650 dark:text-zinc-450 font-medium">
                        {student.age}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-zinc-650 dark:text-zinc-450">
                        <Badge variant="outline" className="border-zinc-200/50 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold px-2.5 py-1">
                          {student.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {student.gpa !== undefined && student.gpa !== null ? (
                          <Badge variant="outline" className="bg-emerald-50/60 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 font-bold px-2 py-0.5">
                            {student.gpa.toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1"
                            disabled={deletingId === student.id}
                            type="button"
                            onClick={() => startEdit(student)}
                          >
                            <Edit3 className="h-3.5 w-3.5 text-zinc-450" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1"
                            disabled={deletingId === student.id}
                            type="button"
                            onClick={() => openEnrollmentModal(student)}
                          >
                            <BookOpen className="h-3.5 w-3.5 text-zinc-450" />
                            <span>Courses</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 border-red-200 dark:border-red-950 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 transition-all flex items-center gap-1"
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
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!isShowingSearchResults && (
        <div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <p className="text-xs font-medium">
              Showing <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{pageStart}-{pageEnd}</strong> of <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{totalStudents}</strong> student records
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  router.push(`/students?page=1&limit=${val}`);
                }}
              >
                <SelectTrigger className="w-16 h-8 text-[11px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  <SelectValue placeholder={String(limit)} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 animate-in fade-in-80">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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

      {/* Official Shadcn Dialog Overlay for Course Enrollment */}
      <Dialog open={activeStudent !== null} onOpenChange={(open) => { if (!open) setActiveStudent(null) }}>
        {activeStudent && (
          <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                <span>Course Enrollment</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">
                Manage enrolled courses and transcripts for <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{activeStudent.name}</strong>.
                {(() => {
                  const totalCredits = studentCourses.reduce((sum, c) => sum + c.credits, 0);
                  const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
                  let totalPoints = 0;
                  let gradedCredits = 0;
                  studentCourses.forEach(c => {
                    if (c.grade && c.grade.toUpperCase() in gradePoints) {
                      totalPoints += gradePoints[c.grade.toUpperCase()] * c.credits;
                      gradedCredits += c.credits;
                    }
                  });
                  const gpa = gradedCredits > 0 ? (totalPoints / gradedCredits).toFixed(2) : "N/A";
                  return (
                    <span className="block mt-1 font-semibold text-zinc-500 dark:text-zinc-400">
                      Total Credits: {totalCredits} &nbsp;&bull;&nbsp; Cumulative GPA: <span className="text-zinc-900 dark:text-white font-bold">{gpa}</span>
                    </span>
                  );
                })()}
              </DialogDescription>
            </DialogHeader>

            {modalError && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Enrolled Courses Block */}
            <div className="mt-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Enrolled Courses ({studentCourses.length})</h3>
                {studentCourses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={printTranscript}
                    className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Transcript</span>
                  </Button>
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
                    <li key={course.id} className="flex items-center justify-between px-3 py-2 text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-semibold text-zinc-850 dark:text-zinc-150 truncate">{course.name}</span>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">{course.code}</span>
                        <span className="text-[10px] text-zinc-400 shrink-0">{course.credits} cr</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Grade Dropdown Selector */}
                        <select
                          value={course.grade || "IP"}
                          onChange={(e) => handleUpdateGrade(course.enrollment_id, e.target.value)}
                          className="h-7 rounded border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300 outline-none"
                        >
                          <option value="IP">In Progress</option>
                          <option value="A">Grade: A</option>
                          <option value="B">Grade: B</option>
                          <option value="C">Grade: C</option>
                          <option value="D">Grade: D</option>
                          <option value="F">Grade: F</option>
                        </select>

                        <Button
                          variant="ghost"
                          onClick={() => requestUnenroll(course.enrollment_id, course.name)}
                          className="h-7 text-[10px] font-bold text-red-650 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add Enrollment Block */}
            {!modalLoading && (
              <form onSubmit={enrollInCourse} className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Enroll in a new course</h3>
                {availableCourses.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">
                    Student is already enrolled in all catalog courses.
                  </p>
                ) : (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select value={selectedCourseId} onValueChange={(val) => setSelectedCourseId(val ?? "")}>
                        <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                          <SelectValue placeholder="Select course...">
                            {selectedCourseId && availableCourses.find((c) => String(c.id) === selectedCourseId)
                              ? (() => {
                                  const c = availableCourses.find((c) => String(c.id) === selectedCourseId)!;
                                  return `${c.code} - ${c.name} (${c.credits} Credits)`;
                                })()
                              : "Select course..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max!">
                          {availableCourses.map((course) => (
                             <SelectItem key={course.id} value={String(course.id)}>
                               {course.code} - {course.name} ({course.credits} Credits)
                             </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      disabled={!selectedCourseId}
                      className="h-10 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 px-4 text-xs font-semibold shadow-sm"
                    >
                      Enroll
                    </Button>
                  </div>
                )}
              </form>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(val) => {
        setEditDialogOpen(val);
        if (!val) {
          setEditingId(null);
          setStudentToEdit(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
              <span>Edit Student Record</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm">
              Update the student details below to modify the record in the directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); if (editingId) saveStudent(editingId); }} className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-450">Full Name</span>
                <Input
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-455">Email Address</span>
                <Input
                  required
                  type="email"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-600 dark:text-zinc-450">Age</span>
                  <Input
                    min={16}
                    max={100}
                    required
                    type="number"
                    placeholder="20"
                    value={form.age || ""}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        age: event.target.value ? Number(event.target.value) : 0,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-600 dark:text-zinc-450">Department</span>
                  <Select
                    value={form.department}
                    onValueChange={(val) =>
                      setForm((current) => ({
                        ...current,
                        department: val ?? "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200">
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max!">
                      {(departments.length > 0 ? departments : ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"]).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                className="h-10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                Cancel
              </Button>
              
              <Button
                disabled={isPending}
                type="submit"
                className="h-10 px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span>Delete Student Record</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm">
              Are you sure you want to permanently delete the record for{" "}
              <strong className="text-zinc-850 dark:text-zinc-200">{studentToDelete?.name}</strong>? 
              This action cannot be undone and will remove all their course enrollment records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setStudentToDelete(null);
              }}
              className="h-9 px-4 text-xs font-semibold text-zinc-650 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="h-9 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 border border-red-700 dark:border-red-600 shadow-sm"
            >
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={unenrollConfirmOpen} onOpenChange={setUnenrollConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span>Unenroll Student from Course</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm">
              Are you sure you want to unenroll the student from the course{" "}
              <strong className="text-zinc-850 dark:text-zinc-200">{enrollmentToUnenroll?.courseName}</strong>? 
              This will remove this course from their current enrollment records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUnenrollConfirmOpen(false);
                setEnrollmentToUnenroll(null);
              }}
              className="h-9 px-4 text-xs font-semibold text-zinc-650 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnenroll}
              className="h-9 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 border border-red-700 dark:border-red-600 shadow-sm"
            >
              Unenroll Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
