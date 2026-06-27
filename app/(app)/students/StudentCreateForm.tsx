"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="overflow-hidden border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-colors duration-350">
      {/* Header section with toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all text-left outline-none"
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
            <CardContent className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 bg-zinc-50/30 dark:bg-zinc-950/20">
              <form onSubmit={createStudent}>
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_0.6fr_1fr_auto] items-end">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Name
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
                  </label>
                  
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Email Address
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
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Age
                    <Input
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
                    <Input
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

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="h-10 px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
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
                  </Button>
                </div>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
