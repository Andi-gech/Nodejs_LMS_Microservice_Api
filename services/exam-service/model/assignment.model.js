const mongoose = require("mongoose");
const joi = require("joi");

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  points: { type: Number, default: 0 },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseModule",
    default: null,
  },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const JoiAssignment = joi.object({
  title: joi.string().required(),
  description: joi.string().allow(""),
  points: joi.number().min(0).optional(),
  course: joi.string().required(),
  module: joi.string().optional().allow(null),
  dueDate: joi.date().optional(),
});

const ValidateAssignment = (data) => JoiAssignment.validate(data);

module.exports.AssignmentSchema = AssignmentSchema;
module.exports.ValidateAssignment = ValidateAssignment;
