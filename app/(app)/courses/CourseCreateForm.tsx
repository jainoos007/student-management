"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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
  const [isExpanded, setIsExpanded] = useState(false);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nameClean = form.name.trim();
    const codeClean = form.code.trim().toUpperCase();
    const creditsNum = Number(form.credits);

    if (!nameClean) {
      const errorMsg = "Course Name cannot be empty.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const codeRegex = /^[A-Z]{2,4}\d{3,4}$/;
    if (!codeRegex.test(codeClean)) {
      const errorMsg = "Course Code must consist of 2 to 4 letters followed by 3 to 4 digits (e.g., CS101, MATH101).";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      const errorMsg = "Credits must be a number between 1 and 10.";
      setError(errorMsg);
      toast.error(errorMsg);
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
      const errorMsg = "Could not add course. Check the details and try again (make sure Code is unique).";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const addedName = nameClean;
    setForm(emptyForm);
    setIsExpanded(false);
    toast.success(`Course "${addedName}" added successfully`);
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
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create Catalog Course</h2>
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
              <form onSubmit={createCourse}>
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] items-end">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Course Name
                    <Input
                      required
                      placeholder="e.g., Introduction to Computer Science"
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
                    Course Code
                    <Input
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

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Credits
                    <Input
                      min={1}
                      max={10}
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

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="h-10 px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Create Course</span>
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
