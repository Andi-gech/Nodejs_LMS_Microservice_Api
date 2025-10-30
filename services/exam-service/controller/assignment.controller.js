const { getModel } = require("../model/getModel");
const { ValidateAssignment } = require("../model/assignment.model");
const {
  ValidateAssignmentSubmission,
} = require("../model/assignmentSubmission.model");

async function createAssignment(req, res) {
  try {
    const { error } = ValidateAssignment(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const payload = { ...req.body, createdBy: req.user?.sub || req.user?._id };
    const a = await Assignment.create(payload);
    res.status(201).json(a);
  } catch (err) {
    console.error("createAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listAssignments(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    const items = await Assignment.find(filter).lean();
    res.json(items);
  } catch (err) {
    console.error("listAssignments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listMyAssignments(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const userId = req.user?.sub || req.user?._id;
    const items = await Assignment.find({ createdBy: userId }).lean();
    res.json(items);
  } catch (err) {
    console.error("listMyAssignments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateAssignment(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("updateAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteAssignment(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const del = await Assignment.findByIdAndDelete(req.params.id);
    res.json({ ok: true, deleted: del });
  } catch (err) {
    console.error("deleteAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAssignmentById(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const item = await Assignment.findById(req.params.id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("getAssignmentById", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listAssignmentSubmissions(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const subs = await Submission.find({ assignment: req.params.id }).lean();
    res.json(subs);
  } catch (err) {
    console.error("listAssignmentSubmissions", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listByCourse(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Assignment = getModel(tenantId, "Assignment");
    const items = await Assignment.find({ course: req.params.courseId }).lean();
    res.json(items);
  } catch (err) {
    console.error("listByCourse", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function submitAssignment(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const file = req.file;
    const payload = {
      assignment: req.params.id,
      student: req.user?.sub || req.user?._id,
      notes: req.body.notes || "",
      filePath: file ? `uploads/assignments/${file.filename}` : undefined,
      submittedAt: new Date(),
    };
    const { error } = ValidateAssignmentSubmission(payload);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const s = await Submission.create(payload);
    res.status(201).json(s);
  } catch (err) {
    console.error("submitAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function gradeAssignment(req, res) {
  try {
    const tenantId = req.tenantId || "default";
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const { grade } = req.body;
    if (grade == null || isNaN(Number(grade)))
      return res
        .status(400)
        .json({ error: "grade is required and must be a number" });
    const studentId = req.params.studentId;
    const sub = await Submission.findOneAndUpdate(
      { assignment: req.params.id, student: studentId },
      { grade, gradedAt: new Date(), gradedBy: req.user?.sub || req.user?._id },
      { new: true }
    );
    if (!sub) return res.status(404).send("Submission not found");
    res.json(sub);
  } catch (err) {
    console.error("gradeAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  listMyAssignments,
  updateAssignment,
  deleteAssignment,
  getAssignmentById,
  listAssignmentSubmissions,
  listByCourse,
  submitAssignment,
  gradeAssignment,
};
