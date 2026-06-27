"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);

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
    setIsExpanded(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-colors duration-350">
      {/* Header section with toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-sm">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Register New Student</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Click to toggle the creation drawer.</p>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-900">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Collapsible Form Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <form onSubmit={createStudent} className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 bg-zinc-50/30 dark:bg-zinc-950/20">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_0.6fr_1fr_auto] items-end">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Name
                  <input
                    className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
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
                </label>
                
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Email Address
                  <input
                    className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
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
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Age
                  <input
                    className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
                    min={1}
                    max={120}
                    required
                    type="number"
                    placeholder="20"
                    value={form.age}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        age: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Department
                  <input
                    className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-500 dark:focus:border-zinc-650 transition-colors"
                    required
                    placeholder="Computer Science"
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
                  className="h-10 rounded-md bg-zinc-950 dark:bg-white dark:text-zinc-950 px-5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700 shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Student</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

