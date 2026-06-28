export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrollment_date: string;
  grade?: string | null;
  deleted_at?: string | null;
}
