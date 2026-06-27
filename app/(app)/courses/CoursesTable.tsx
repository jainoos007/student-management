"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { Course } from "@/types/course";
import { 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Loader2, 
  X, 
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [sortColumn, setSortColumn] = useState<"name" | "code" | "credits" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const displayedCourses = searchResults ?? courses;

  const sortedCourses = [...displayedCourses].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column: "name" | "code" | "credits") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  function exportCSV() {
    if (displayedCourses.length === 0) return;
    const headers = ["ID", "Name", "Code", "Credits", "Created At"];
    const rows = displayedCourses.map((course) =>
      [
        course.id,
        course.name,
        course.code,
        course.credits,
        course.created_at,
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
    link.setAttribute("download", `courses_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
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
      const errorMsg = "Could not update course. Check the details and try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    toast.success("Course details updated successfully");
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
      const errorMsg = "Could not delete course. Try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      setDeletingId(null);
      return;
    }

    toast.success(`Course "${name}" deleted successfully`);
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
    <div className="flex flex-col gap-6">
      {/* Filtering and Query Commands Header */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-colors duration-350">
        <form
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={searchCourses}
        >
          <div className="relative flex-1">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 block mb-1.5 font-medium">Search Courses</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                className="pl-9 pr-3 h-10 w-full"
                placeholder="Search course name or code..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              disabled={isSearching}
              type="submit"
              className="h-10 px-5 text-sm font-semibold flex items-center gap-1.5 shadow-sm bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Search</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-205"
              type="button"
              onClick={clearSearch}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-205 flex items-center gap-1.5"
              type="button"
              onClick={exportCSV}
              disabled={displayedCourses.length === 0}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Directory Table Body */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-colors duration-350">
        {error && (
          <div className="border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/25 px-5 py-4 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {displayedCourses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BookOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">No courses found</h2>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Try a different query or register a new course record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[760px]">
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/30">
                <TableRow>
                  <TableHead className="px-6 py-3.5 w-16">ID</TableHead>
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                      {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("code")}
                    className="px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Code</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                      {sortColumn === "code" && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("credits")}
                    className="px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Credits</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                      {sortColumn === "credits" && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3.5">Created At</TableHead>
                  <TableHead className="px-6 py-3.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCourses.map((course) => {
                  const isEditing = editingId === course.id;

                  return (
                    <TableRow key={course.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                        #{course.id}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {isEditing ? (
                          <Input
                            className="h-9 w-full"
                            value={form.name}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{course.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {isEditing ? (
                          <Input
                            className="h-9 w-32"
                            value={form.code}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                code: event.target.value.toUpperCase(),
                              }))
                            }
                          />
                        ) : (
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 text-xs px-2.5 py-1 rounded font-semibold border border-zinc-200/10">
                            {course.code}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-zinc-650 dark:text-zinc-450 font-medium">
                        {isEditing ? (
                          <Input
                            className="h-9 w-20"
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
                          <span>{course.credits} Credits</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {new Date(course.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                                disabled={isPending}
                                type="button"
                                onClick={() => saveCourse(course.id)}
                              >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span>Save</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="h-8 border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1"
                                disabled={isPending}
                                type="button"
                                onClick={cancelEdit}
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Cancel</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                className="h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1"
                                disabled={deletingId === course.id}
                                type="button"
                                onClick={() => startEdit(course)}
                              >
                                <Edit3 className="h-3.5 w-3.5 text-zinc-450" />
                                <span>Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="h-8 border-red-150 dark:border-red-955 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-750 transition-all flex items-center gap-1"
                                disabled={deletingId === course.id}
                                type="button"
                                onClick={() =>
                                  deleteCourse(course.id, course.name)
                                }
                              >
                                {deletingId === course.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                )}
                                <span>Delete</span>
                              </Button>
                            </>
                          )}
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
        <div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <p className="text-xs font-medium">
              Showing <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{pageStart}-{pageEnd}</strong> of <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{totalCourses}</strong> course catalog listings
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  router.push(`/courses?page=1&limit=${val}`);
                }}
              >
                <SelectTrigger className="w-16 h-8 text-[11px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  <SelectValue placeholder={String(limit)} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
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
              <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-950 flex items-center gap-1">
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
              <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-950 flex items-center gap-1">
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
