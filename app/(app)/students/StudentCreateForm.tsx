"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition, useEffect } from "react";
import { Plus, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    }
    if (open) {
      loadDepartments();
    }
  }, [open]);

  const departmentOptions = departments.length > 0
    ? departments
    : ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"];

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
      const data = await response.json().catch(() => ({}));
      const errorMsg = data.message || "Could not add student. Check the details and try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const registeredName = form.name;
    setForm(emptyForm);
    setError(null);
    setOpen(false);
    toast.success(`Student "${registeredName}" registered successfully`);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setError(null);
        setForm(emptyForm);
      }
    }}>
      <Button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto h-11 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 px-5 text-sm font-semibold shadow-md flex items-center justify-center gap-2 rounded-xl border border-transparent"
      >
        <UserPlus className="h-4 w-4" />
        <span>Register New Student</span>
      </Button>
      
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Register New Student</DialogTitle>
          <DialogDescription className="text-zinc-400 dark:text-zinc-500">
            Enter the details below to add a new student record to the system directory.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={createStudent} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/25 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-600 dark:text-zinc-450">Full Name</span>
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
            </div>
            
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-600 dark:text-zinc-455">Email Address</span>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-450">Age</span>
                <Input
                  min={16}
                  max={100}
                  required
                  type="number"
                  placeholder="20"
                  value={form.age}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      age: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-600 dark:text-zinc-450">Department</span>
                <Select
                  value={form.department}
                  onValueChange={(val) =>
                    setForm((current) => ({
                      ...current,
                      department: val ?? "",
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max!">
                    {departmentOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              Cancel
            </Button>
            
            <Button
              disabled={isPending}
              type="submit"
              className="h-10 px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
