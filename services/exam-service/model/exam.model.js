const mongoose = require("mongoose");
const joi = require("joi");

const ExamSchema = new mongoose.Schema({
  title: String,
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  // Direct course reference (course-level exams only)
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ExamMark: Number,
  examDuration: Number,
  examDate: { type: Date, default: null },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

// Export schema so services can create tenant-scoped models via getModel
const JoiExam = joi.object({
  title: joi.string().required(),
  questions: joi.array().required(),
  course: joi.string().required(),
  createdBy: joi.string().optional(),
  ExamMark: joi.number().required(),
  examDuration: joi.number().required(),
  examDate: joi.date().optional(),
  startTime: joi.date().optional(),
  endTime: joi.date().min(joi.ref("startTime")).optional().messages({
    "date.min": "endTime must be equal to or after startTime",
  }),
  status: joi.string().valid("pending", "approved", "rejected").optional(),
});

const ValidateJoiSchema = (data) => JoiExam.validate(data);

module.exports.ExamSchema = ExamSchema;
module.exports.ValidateJoiSchema = ValidateJoiSchema;
