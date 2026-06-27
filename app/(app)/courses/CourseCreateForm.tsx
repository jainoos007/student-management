"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Plus, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
    toast.success(`Course "${addedName}" added successfully`);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      setIsOpen(val);
      if (!val) {
        setForm(emptyForm);
        setError(null);
      }
    }}>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-10 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 px-4 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
      >
        <Plus className="h-4 w-4" />
        <span>Register Course</span>
      </Button>
      
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-950 dark:text-white font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
            <span>Create Catalog Course</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 dark:text-zinc-500">
            Enter the details below to add a new course record to the system directory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={createCourse} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-600 dark:text-zinc-450">Course Name</span>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-455">Course Code</span>
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
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-450">Credits</span>
                <Input
                  min={1}
                  max={10}
                  required
                  type="number"
                  placeholder="e.g., 3"
                  value={form.credits}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      credits: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              type="submit"
              className="h-10 px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
