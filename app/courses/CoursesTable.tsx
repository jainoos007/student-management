"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { Course } from "@/types/course";

type EditableCourse = Pick<
  Course,
  "id" | "name" | "code" | "credits"
>;

type FormState = Omit<EditableCourse, "id">;

type CoursesTableProps = {
  currentPage: number;
  limit: number;
  courses: Course[];
  totalPages: number;
  totalCourses: number;
};

export function CoursesTable({
  currentPage,
  limit,
  courses,
  totalPages,
  totalCourses,
}: CoursesTableProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<Course[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    code: "",
    credits: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  const displayedCourses = searchResults ?? courses;
  const isShowingSearchResults = searchResults !== null;
  const pageStart =
    totalCourses === 0 ? 0 : Math.min((currentPage - 1) * limit + 1, totalCourses);
  const pageEnd = Math.min(currentPage * limit, totalCourses);

  function getPageHref(page: number) {
    return `/courses?page=${page}&limit=${limit}`;
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      code: course.code,
      credits: course.credits,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveCourse(id: number) {
    setError(null);

    const response = await fetch(`/api/course/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setError("Could not update course. Check the details and try again.");
      return;
    }

    setEditingId(null);
    setSearchResults((current) =>
      current
        ? current.map((course) =>
            course.id === id ? { ...course, ...form } : course,
          )
        : current,
    );
    startTransition(() => {
      router.refresh();
    });
  }

  async function deleteCourse(id: number, name: string) {
    const shouldDelete = window.confirm(`Delete course "${name}"? This will delete all student enrollments in this course.`);

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setDeletingId(id);

    const response = await fetch(`/api/course/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Could not delete course. Try again.");
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    setSearchResults((current) =>
      current ? current.filter((course) => course.id !== id) : current,
    );
    setDeletingId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function searchCourses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEditingId(null);
    setIsSearching(true);

    const query = searchQuery.trim();
    const response = await fetch(
      query
        ? `/api/course?query=${encodeURIComponent(query)}`
        : `/api/course?page=${currentPage}&limit=${limit}`,
    );

    if (!response.ok) {
      setError("Could not search courses. Try again.");
      setIsSearching(false);
      return;
    }

    const results = (await response.json()) as Course[];
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
        onSubmit={searchCourses}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-700">
          Search Courses
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            placeholder="Name, code, or credits"
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

      {displayedCourses.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No courses found</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try a different search or add a new course.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Credits</th>
                <th className="px-5 py-3 font-semibold">Created At</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayedCourses.map((course) => {
                const isEditing = editingId === course.id;

                return (
                  <tr key={course.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                      {course.id}
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
                        <span className="font-medium">{course.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {isEditing ? (
                        <input
                          className="h-9 w-32 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                          value={form.code}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              code: event.target.value.toUpperCase(),
                            }))
                          }
                        />
                      ) : (
                        <span className="font-mono bg-zinc-100 text-zinc-800 text-xs px-2 py-1 rounded">
                          {course.code}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {isEditing ? (
                        <input
                          className="h-9 w-20 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                          min={1}
                          type="number"
                          value={form.credits}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              credits: Number(event.target.value),
                            }))
                          }
                        />
                      ) : (
                        course.credits
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                              disabled={isPending}
                              type="button"
                              onClick={() => saveCourse(course.id)}
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
                              disabled={deletingId === course.id}
                              type="button"
                              onClick={() => startEdit(course)}
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                              disabled={deletingId === course.id}
                              type="button"
                              onClick={() =>
                                deleteCourse(course.id, course.name)
                              }
                            >
                              {deletingId === course.id
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
            Showing {pageStart}-{pageEnd} of {totalCourses}
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
          Showing {displayedCourses.length} search result
          {displayedCourses.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
