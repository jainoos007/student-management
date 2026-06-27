"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { Student } from "@/types/student";
import type { Course } from "@/types/course";

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
    } catch (err: any) {
      setModalError(err.message || "An error occurred while loading courses.");
    } finally {
      setModalLoading(false);
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
    setSearchResults(null);
    setError(null);
    setEditingId(null);
  }

  return (
    <div>
      <form
        className="flex flex-col gap-3 border-b border-zinc-200 p-5 sm:flex-row sm:items-end"
        onSubmit={searchStudents}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-700">
          Search
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            placeholder="Name, email, or department"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <button
            className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isSearching}
            type="submit"
          >
            {isSearching ? "Searching" : "Search"}
          </button>
          <button
            className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            type="button"
            onClick={clearSearch}
          >
            Clear
          </button>
        </div>
      </form>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {displayedStudents.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No students found</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try a different search or add a new student.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayedStudents.map((student) => {
                const isEditing = editingId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                      {student.id}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input
                          className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                          value={form.name}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="font-medium">{student.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {isEditing ? (
                        <input
                          className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
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
                    <td className="px-5 py-4 text-zinc-600">
                      {isEditing ? (
                        <input
                          className="h-9 w-20 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
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
                    <td className="px-5 py-4 text-zinc-600">
                      {isEditing ? (
                        <input
                          className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                          value={form.department}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              department: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        student.department
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {student.created_at}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                              disabled={isPending}
                              type="button"
                              onClick={() => saveStudent(student.id)}
                            >
                              {isPending ? "Saving" : "Save"}
                            </button>
                            <button
                              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                              disabled={isPending}
                              type="button"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                              disabled={deletingId === student.id}
                              type="button"
                              onClick={() => startEdit(student)}
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                              disabled={deletingId === student.id}
                              type="button"
                              onClick={() => openEnrollmentModal(student)}
                            >
                              Courses
                            </button>
                            <button
                              className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                              disabled={deletingId === student.id}
                              type="button"
                              onClick={() =>
                                deleteStudent(student.id, student.name)
                              }
                            >
                              {deletingId === student.id
                                ? "Deleting"
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isShowingSearchResults ? (
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {pageStart}-{pageEnd} of {totalStudents}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                href={getPageHref(currentPage - 1)}
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 font-medium text-zinc-400">
                Previous
              </span>
            )}
            <span className="font-medium text-zinc-700">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                href={getPageHref(currentPage + 1)}
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 font-medium text-zinc-400">
                Next
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-zinc-200 px-5 py-4 text-sm text-zinc-600">
          Showing {displayedStudents.length} search result
          {displayedStudents.length === 1 ? "" : "s"}
        </div>
      )}

      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 shadow-xl text-zinc-950">
            <button
              onClick={() => setActiveStudent(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold">Course Enrollment</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Manage enrolled courses for <strong className="text-zinc-900">{activeStudent.name}</strong> ({activeStudent.email})
            </p>

            {modalError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalError}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-700">Enrolled Courses ({studentCourses.length})</h3>
              {modalLoading ? (
                <p className="text-sm text-zinc-500 mt-2">Loading courses...</p>
              ) : studentCourses.length === 0 ? (
                <p className="text-sm text-zinc-500 mt-2 italic">Not enrolled in any courses yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-zinc-100 max-h-48 overflow-y-auto border border-zinc-200 rounded-md">
                  {studentCourses.map((course) => (
                    <li key={course.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-zinc-900">{course.name}</span>
                        <span className="ml-2 font-mono bg-zinc-100 text-zinc-700 text-xs px-1.5 py-0.5 rounded">{course.code}</span>
                        <span className="ml-2 text-xs text-zinc-500">{course.credits} cr</span>
                      </div>
                      <button
                        onClick={() => unenrollFromCourse(course.enrollment_id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!modalLoading && (
              <form onSubmit={enrollInCourse} className="mt-6 pt-4 border-t border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-700">Enroll in a new course</h3>
                <div className="mt-2 flex gap-2">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500"
                  >
                    <option value="">Select a course to enroll...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name} ({course.credits} Credits)
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!selectedCourseId}
                    className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  >
                    Enroll
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveStudent(null)}
                className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
