const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    faculty: { type: String },
  },
  { timestamps: true }
);

// Export the schema for tenant-scoped model creation
module.exports = { DepartmentSchema };
