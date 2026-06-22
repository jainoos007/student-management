"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type CreateFormState = {
  name: string;
  email: string;
  age: string;
  department: string;
};

const emptyForm: CreateFormState = {
  name: "",
  email: "",
  age: "",
  department: "",
};

export function StudentCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
      }),
    });

    if (!response.ok) {
      setError("Could not add student. Check the details and try again.");
      return;
    }

    setForm(emptyForm);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form
      className="rounded-lg border border-zinc-200 bg-white p-5"
      onSubmit={createStudent}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Add student</h2>
        <p className="text-sm text-zinc-500">
          Create a new student record in the directory.
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_1.4fr_0.6fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Name
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Email
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            required
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Age
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            min={1}
            required
            type="number"
            value={form.age}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                age: event.target.value,
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Department
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            required
            value={form.department}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                department: event.target.value,
              }))
            }
          />
        </label>
        <button
          className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Adding" : "Add"}
        </button>
      </div>
    </form>
  );
}
