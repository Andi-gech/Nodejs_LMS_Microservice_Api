import type { Document, Types } from "mongoose";

export type GradePolicyAttribute =
  | "Exam"
  | "Assignment"
  | "Project"
  | "Quiz"
  | "Attendance";

export interface GradePolicy {
  attribute: GradePolicyAttribute;
  weight: number;
  refModel?: "Exam" | "Assignment" | "Project" | null;
  refId?: Types.ObjectId | null;
}

export interface CourseDocument extends Document {
  code: string;
  name: string;
  image: string;
  description: string;
  createdBy: Types.ObjectId;
  assignedTeacher?: Types.ObjectId | null;
  startDate?: Date | null;
  endDate?: Date | null;
  GradePolicy: GradePolicy[];
  departmentId: Types.ObjectId;
  credits: number;

  getRemainingWeight(): number;
}
