"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  GraduationCap, 
  Mail, 
  Building2, 
  CalendarDays, 
  Award,
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Printer,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Student = {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  created_at: string;
  gpa?: number | null;
};

type Course = {
  id: number;
  name: string;
  code: string;
  credits: number;
};

type EnrolledCourse = Course & {
  enrollment_id: number;
  grade?: string | null;
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Load student records
  async function loadStudentData() {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Student record not found.");
        throw new Error("Failed to load student details.");
      }
      const data = await res.json();
      setStudent(data);
      
      // Initialize edit fields
      setEditName(data.name);
      setEditEmail(data.email);
      setEditAge(String(data.age));
      setEditDept(data.department);

      // Load enrolled courses
      let enrolledList: EnrolledCourse[] = [];
      const coursesRes = await fetch(`/api/students/${studentId}/courses`);
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        enrolledList = coursesData.data || [];
        setEnrolledCourses(enrolledList);
      }

      // Load all courses to determine available ones
      const allRes = await fetch("/api/course?limit=100");
      if (allRes.ok) {
        const allData = await allRes.json();
        // Filter out courses student is already enrolled in
        const enrolledIds = new Set(enrolledList.map((c) => c.id));
        const filtered = allData.filter((c: Course) => !enrolledIds.has(c.id));
        setAvailableCourses(filtered);
      }
    } catch (err: any) {
      setStudentError(err.message || "Failed to load student records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  // Handle Grade Selection
  async function handleGradeChange(enrollmentId: number, newGrade: string) {
    try {
      const gradeVal = newGrade === "IP" ? null : newGrade;
      const res = await fetch(`/api/enrollment/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: gradeVal }),
      });

      if (!res.ok) throw new Error("Failed to update course grade.");

      toast.success("Grade updated successfully");
      
      // Update local state grade value
      setEnrolledCourses(prev =>
        prev.map(c => c.enrollment_id === enrollmentId ? { ...c, grade: gradeVal } : c)
      );

      // Reload student details to fetch updated cumulative GPA
      const updatedStudentRes = await fetch(`/api/students/${studentId}`);
      if (updatedStudentRes.ok) {
        const updatedStudent = await updatedStudentRes.json();
        setStudent(updatedStudent);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not update course grade.");
    }
  }

  // Handle Enrollment
  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const res = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          course_id: Number(selectedCourseId),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to enroll student.");
      }

      toast.success("Enrolled in course successfully");
      setSelectedCourseId("");
      loadStudentData();
    } catch (err: any) {
      toast.error(err.message || "Could not complete enrollment.");
    }
  }

  // Handle Unenrollment
  async function handleUnenroll(enrollmentId: number, courseName: string) {
    try {
      const res = await fetch(`/api/enrollment/${enrollmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to unenroll student.");

      toast.success(`Successfully unenrolled from "${courseName}"`);
      loadStudentData();
    } catch (err: any) {
      toast.error(err.message || "Could not complete unenrollment.");
    }
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          age: Number(editAge),
          department: editDept,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile.");
      }

      toast.success("Student profile updated successfully");
      setEditOpen(false);
      loadStudentData();
    } catch (err: any) {
      toast.error(err.message || "Could not update student details.");
    } finally {
      setEditSubmitting(false);
    }
  }

  // Handle Delete Submit
  async function handleDeleteSubmit() {
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete student profile.");

      toast.success("Student profile deleted successfully (soft delete)");
      setDeleteOpen(false);
      router.push("/students");
    } catch (err: any) {
      toast.error(err.message || "Could not delete student.");
      setDeleteSubmitting(false);
    }
  }

  // Print Academic Transcript
  function handlePrintTranscript() {
    if (!student) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCredits = enrolledCourses.reduce((sum, c) => sum + c.credits, 0);
    const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    
    let totalPoints = 0;
    let gradedCredits = 0;
    enrolledCourses.forEach(c => {
      if (c.grade && c.grade.toUpperCase() in gradePoints) {
        totalPoints += gradePoints[c.grade.toUpperCase()] * c.credits;
        gradedCredits += c.credits;
      }
    });
    const cumulativeGpa = gradedCredits > 0 ? (totalPoints / gradedCredits).toFixed(2) : "N/A";

    const html = `
      <html>
        <head>
          <title>Academic Transcript - ${student.name}</title>
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
              <div><strong>Student Name:</strong> ${student.name}</div>
              <div><strong>Email:</strong> ${student.email}</div>
              <div><strong>Department:</strong> ${student.department}</div>
              <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <h3>Enrolled Courses</h3>
          ${enrolledCourses.length === 0 ? `
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
                ${enrolledCourses.map(course => `
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
            Total Courses: ${enrolledCourses.length} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            Total Credits: ${totalCredits} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            Cumulative GPA: ${cumulativeGpa}
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

  // Calculate Cumulative GPA for displays
  const getGpaDisplay = () => {
    if (!student || student.gpa === undefined || student.gpa === null) return "N/A";
    return student.gpa.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-550">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold italic">Retrieving profile record...</span>
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <main className="p-6 sm:p-10 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Profile Error</h2>
          <p className="text-sm text-zinc-500 mt-2">{studentError || "Student record could not be loaded."}</p>
          <button
            onClick={() => router.push("/students")}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 px-5 text-sm font-semibold transition-colors"
          >
            Return to Directory
          </button>
        </div>
      </main>
    );
  }

  const nameInitials = student.name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/students")}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Students</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        
        {/* Left Side: Profile Detail Card */}
        <section className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
            {/* HSL Gradient Bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
            
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm mt-4">
              {nameInitials}
            </div>

            {/* Profile Info */}
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">{student.name}</h2>
            <Badge variant="outline" className="mt-1 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
              {student.department}
            </Badge>

            {/* Meta values */}
            <div className="w-full space-y-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-650 dark:text-zinc-400 text-left">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-450 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-450 shrink-0" />
                <span>Department of {student.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-450 shrink-0" />
                <span>Enrolled {new Date(student.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-zinc-450 shrink-0" />
                <span>Student Age: {student.age} Years Old</span>
              </div>
            </div>

            {/* Highlighted GPA section */}
            <div className="w-full mt-6 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/50 rounded-lg p-4 flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">Cumulative GPA</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{getGpaDisplay()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
            </div>

            {/* Bottom Actions grid */}
            <div className="grid grid-cols-3 gap-2 w-full mt-6">
              <Button
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Edit className="h-3.5 w-3.5 mr-1 text-zinc-450" />
                <span>Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintTranscript}
                className="h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Printer className="h-3.5 w-3.5 mr-1 text-zinc-450" />
                <span>Print</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="h-9 text-xs font-semibold border-red-200 dark:border-red-950 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-red-450" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Right Side: Course Enrollments and GPA Manager */}
        <section className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-sm">
            
            {/* Title */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span>Academic Record ({enrolledCourses.length})</span>
              </h2>
            </div>

            {/* List Enrolled Courses */}
            {enrolledCourses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-450 dark:text-zinc-500 italic">
                  This student is not enrolled in any courses yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg mb-6">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-950/30 text-xs text-zinc-400 dark:text-zinc-500 font-bold border-b border-zinc-200/50 dark:border-zinc-800">
                      <th className="px-4 py-3 font-semibold">Course Code</th>
                      <th className="px-4 py-3 font-semibold">Course Name</th>
                      <th className="px-4 py-3 font-semibold">Credits</th>
                      <th className="px-4 py-3 font-semibold">Academic Grade</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/85 text-xs">
                    {enrolledCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/5 transition-colors font-medium">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="font-mono font-bold bg-zinc-50 dark:bg-zinc-950 text-[10px] border-zinc-200 dark:border-zinc-850 px-2 py-0.5">
                            {course.code}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-150">
                          {course.name}
                        </td>
                        <td className="px-4 py-3 text-zinc-550 dark:text-zinc-450 font-bold">
                          {course.credits} Credits
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={course.grade || "IP"}
                            onChange={(e) => handleGradeChange(course.enrollment_id, e.target.value)}
                            className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px] font-bold px-2 py-1 text-zinc-700 dark:text-zinc-300 outline-none"
                          >
                            <option value="IP">In Progress</option>
                            <option value="A">Grade A (4.0)</option>
                            <option value="B">Grade B (3.0)</option>
                            <option value="C">Grade C (2.0)</option>
                            <option value="D">Grade D (1.0)</option>
                            <option value="F">Grade F (0.0)</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            onClick={() => handleUnenroll(course.enrollment_id, course.name)}
                            className="h-8 text-[11px] font-bold text-red-650 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          >
                            Unenroll
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Enrollment Area */}
            <form onSubmit={handleEnroll} className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Enroll student in a new course</h3>
              {availableCourses.length === 0 ? (
                <p className="text-xs text-zinc-450 dark:text-zinc-500 italic py-2">
                  This student is already enrolled in all catalog courses.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1">
                    <Select value={selectedCourseId} onValueChange={(val) => setSelectedCourseId(val ?? "")}>
                      <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs">
                        <SelectValue placeholder="Select course...">
                          {selectedCourseId && availableCourses.find((c) => String(c.id) === selectedCourseId)
                            ? (() => {
                                const c = availableCourses.find((c) => String(c.id) === selectedCourseId)!;
                                return `${c.code} - ${c.name} (${c.credits} Credits)`;
                              })()
                            : "Select course..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max! max-h-48 overflow-y-auto">
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
                    className="h-10 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 px-5 text-xs font-semibold shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Enroll Student</span>
                  </Button>
                </div>
              )}
            </form>

          </div>
        </section>
      </div>

      {/* Edit Student Dialog Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-500" />
              <span>Edit Student Profile</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">
              Modify the student profile details. Click save to commit changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div>
              <label htmlFor="edit_name" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Full Name</label>
              <input
                id="edit_name"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-transparent text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="edit_email" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Email Address</label>
              <input
                id="edit_email"
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-transparent text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_age" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Age</label>
                <input
                  id="edit_age"
                  type="number"
                  required
                  min="16"
                  max="100"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-transparent text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label htmlFor="edit_dept" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Department</label>
                <select
                  id="edit_dept"
                  required
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-sm text-zinc-850 dark:text-zinc-100 outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={editSubmitting}
                onClick={() => setEditOpen(false)}
                className="h-10 text-xs font-semibold border-zinc-200 dark:border-zinc-850"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                className="h-10 bg-zinc-950 text-white hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-semibold shadow-sm"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Delete Student Record</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">
              Are you sure you want to delete the student profile for <strong className="text-zinc-950 dark:text-white">{student.name}</strong>?
              This will also soft-delete all their current course enrollments.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteSubmitting}
              onClick={() => setDeleteOpen(false)}
              className="h-10 text-xs font-semibold border-zinc-200 dark:border-zinc-850"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleteSubmitting}
              onClick={handleDeleteSubmit}
              className="h-10 bg-red-600 text-white hover:bg-red-750 text-xs font-semibold shadow-sm"
            >
              {deleteSubmitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
