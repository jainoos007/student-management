import { connection } from "next/server";
import { getStudents } from "@/lib/student";

export const metadata = {
  title: "Students",
  description: "Student directory",
};

export default async function StudentsPage() {
  await connection();

  const students = getStudents();
  const departmentCount = new Set(students.map((student) => student.department))
    .size;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Student Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Students
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Total students</p>
              <p className="mt-1 text-2xl font-semibold">{students.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Departments</p>
              <p className="mt-1 text-2xl font-semibold">{departmentCount}</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <h2 className="text-lg font-semibold">No students found</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Add students to the database to see them listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Age</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                        {student.id}
                      </td>
                      <td className="px-5 py-4 font-medium">{student.name}</td>
                      <td className="px-5 py-4 text-zinc-600">
                        {student.email}
                      </td>
                      <td className="px-5 py-4 text-zinc-600">{student.age}</td>
                      <td className="px-5 py-4 text-zinc-600">
                        {student.department}
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        {student.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
