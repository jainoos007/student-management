"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type CreateCourseFormState = {
  name: string;
  code: string;
  credits: string;
};

const emptyForm: CreateCourseFormState = {
  name: "",
  code: "",
  credits: "",
};

export function CourseCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateCourseFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nameClean = form.name.trim();
    const codeClean = form.code.trim().toUpperCase();
    const creditsNum = Number(form.credits);

    if (!nameClean) {
      setError("Course Name cannot be empty.");
      return;
    }

    // Validation: 2-4 letters followed by 3-4 digits
    const codeRegex = /^[A-Z]{2,4}\d{3,4}$/;
    if (!codeRegex.test(codeClean)) {
      setError("Course Code must consist of 2 to 4 letters followed by 3 to 4 digits (e.g., CS101, MATH101).");
      return;
    }

    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      setError("Credits must be a number between 1 and 10.");
      return;
    }

    const response = await fetch("/api/course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameClean,
        code: codeClean,
        credits: creditsNum,
      }),
    });

    if (!response.ok) {
      setError("Could not add course. Check the details and try again (make sure Code is unique).");
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
      onSubmit={createCourse}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Add course</h2>
        <p className="text-sm text-zinc-500">
          Create a new course record in the catalog.
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Course Name
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            required
            value={form.name}
            placeholder="e.g., Introduction to Computer Science"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Course Code
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            required
            placeholder="e.g., CS101"
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: event.target.value.toUpperCase(),
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Credits
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500"
            min={1}
            required
            type="number"
            placeholder="e.g., 3"
            value={form.credits}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                credits: event.target.value,
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
