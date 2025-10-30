const mongoose = require("mongoose");
const joi = require("joi");

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filePath: { type: String },
  notes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, default: null },
  gradedAt: { type: Date, default: null },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const JoiAssignmentSubmission = joi.object({
  assignment: joi.string().required(),
  student: joi.string().required(),
  filePath: joi.string().optional(),
  notes: joi.string().optional().allow(""),
});

const ValidateAssignmentSubmission = (data) =>
  JoiAssignmentSubmission.validate(data);

module.exports.AssignmentSubmissionSchema = AssignmentSubmissionSchema;
module.exports.ValidateAssignmentSubmission = ValidateAssignmentSubmission;
