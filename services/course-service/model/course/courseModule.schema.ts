import mongoose from "mongoose";

export const CourseModuleSchema = new mongoose.Schema(
  {
    name: { type: String },
    content: { type: String },
    videolink: { type: String },
    linkUrl: { type: String },
    type: {
      type: String,
      enum: ["text", "video", "link", "file"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    order: {
      type: Number,
      min: 0,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  { timestamps: true }
);

export type CourseModuleDocument = mongoose.Document & {
  name?: string;
  content?: string;
  videolink?: string;
  linkUrl?: string;
  type?: string;
  status?: string;
  order?: number;
  course?: mongoose.Types.ObjectId | string;
};
