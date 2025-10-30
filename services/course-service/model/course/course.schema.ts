import { Schema } from "mongoose";
import { GradePolicy, CourseDocument } from "./course.types";

const GradePolicySchema = new Schema<GradePolicy>({
  attribute: {
    type: String,
    enum: ["Exam", "Assignment", "Project", "Quiz", "Attendance"],
    required: true,
  },
  weight: { type: Number, required: true },
  refModel: {
    type: String,
    enum: ["Exam", "Assignment", "Project"],
    required: false,
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
});

const CourseSchema = new Schema<CourseDocument>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true },
  assignedTeacher: { type: Schema.Types.ObjectId, default: null },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  GradePolicy: [GradePolicySchema],
  departmentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  credits: { type: Number, required: true },
});

// Pre-save hook to validate total weight <= 100
CourseSchema.pre<CourseDocument>("save", function (next) {
  const totalWeight = this.GradePolicy.reduce((sum, gp) => sum + gp.weight, 0);
  if (totalWeight > 100) {
    return next(
      new Error(
        `Total GradePolicy weights cannot exceed 100. Currently: ${totalWeight}`
      )
    );
  }
  next();
});

// Helper method to get remaining weight allowed
CourseSchema.methods.getRemainingWeight = function (): number {
  const totalWeight = this.GradePolicy.reduce(
    (sum: number, gp: GradePolicy) => sum + gp.weight,
    0
  );
  return 100 - totalWeight;
};

export { GradePolicySchema, CourseSchema };
