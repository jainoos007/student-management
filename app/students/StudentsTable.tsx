"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Student } from "@/types/student";

type EditableStudent = Pick<
  Student,
  "id" | "name" | "email" | "age" | "department"
>;

type FormState = Omit<EditableStudent, "id">;

export function StudentsTable({ students }: { students: Student[] }) {
  const router = useRouter();
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

    setDeletingId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-5 py-3 font-semibold">ID</th>
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Age</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Created</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((student) => {
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
                          className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                          disabled={deletingId === student.id}
                          type="button"
                          onClick={() =>
                            deleteStudent(student.id, student.name)
                          }
                        >
                          {deletingId === student.id ? "Deleting" : "Delete"}
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
  );
}
