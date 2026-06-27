import { z } from "zod";

export const StudentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email address format")
    .trim()
    .toLowerCase(),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(16, "Students must be at least 16 years old")
    .max(100, "Age must not exceed 100 years"),
  department: z
    .string()
    .min(2, "Department name must be at least 2 characters long")
    .max(50, "Department must not exceed 50 characters")
    .trim(),
});

export const StudentUpdateSchema = StudentSchema.extend({
  id: z.number().int().positive(),
});

export const CourseSchema = z.object({
  name: z
    .string()
    .min(3, "Course name must be at least 3 characters long")
    .max(100, "Course name must not exceed 100 characters")
    .trim(),
  code: z
    .string()
    .min(3, "Course code must be at least 3 characters long")
    .max(10, "Course code must not exceed 10 characters")
    .trim()
    .toUpperCase(),
  credits: z
    .number()
    .int("Credits must be a whole number")
    .min(1, "Credits must be at least 1")
    .max(6, "Credits must not exceed 6"),
});

export const CourseUpdateSchema = CourseSchema.extend({
  id: z.number().int().positive(),
});

export const EnrollmentSchema = z.object({
  student_id: z.number().int().positive("Invalid Student ID"),
  course_id: z.number().int().positive("Invalid Course ID"),
});
