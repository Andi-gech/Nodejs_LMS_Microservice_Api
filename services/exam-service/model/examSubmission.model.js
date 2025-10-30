const mongoose = require("mongoose");

const AnswerEntrySchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
    text: { type: String },
  },
  { _id: false }
);

const ExamSubmissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [AnswerEntrySchema], default: [] },
    autoScore: { type: Number, default: 0 },
    manualScore: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "graded"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

ExamSubmissionSchema.index({ exam: 1, user: 1 }, { unique: true });

// Export schema so tenant-scoped models can be created via getModel
module.exports.ExamSubmissionSchema = ExamSubmissionSchema;
