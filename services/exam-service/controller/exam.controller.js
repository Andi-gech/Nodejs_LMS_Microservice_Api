const { ValidateJoiSchema } = require("../model/exam.model");
const { getModel } = require("../model/getModel");

async function createExam(req, res) {
  try {
    const { error } = ValidateJoiSchema(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const Exam = getModel(req.tenantId || "default", "Exam");
    const exam = await Exam.create(req.body);
    // publish exam.created event (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "exam.created",
          tenantId: req.tenantId || "default",
          examId: exam._id.toString(),
          title: exam.title,
        };
        await sendMessage(defaultTopic, event);
      } catch (err) {
        console.error("Failed to publish exam.created", err && err.message);
      }
    })();
    res.status(201).json(exam);
  } catch (err) {
    console.error("Error creating exam", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listExams(req, res) {
  try {
    const Exam = getModel(req.tenantId || "default", "Exam");
    const items = await Exam.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing exams", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getExamById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Exam = getModel(req.tenantId || "default", "Exam");
    const item = await Exam.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching exam", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateExam(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Exam = getModel(req.tenantId || "default", "Exam");
    const updated = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("Error updating exam", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteExam(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Exam = getModel(req.tenantId || "default", "Exam");
    const del = await Exam.findByIdAndDelete(id);
    res.json(del);
  } catch (err) {
    console.error("Error deleting exam", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listApprovals(req, res) {
  try {
    const status = req.query.status || "pending";
    const course = req.query.course;
    const Exam = getModel(req.tenantId || "default", "Exam");
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (course) filter.course = course;
    const items = await Exam.find(filter).lean();
    res.json(items);
  } catch (err) {
    console.error("listApprovals error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function approveExam(req, res) {
  try {
    const id = req.params.examId || req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Exam = getModel(req.tenantId || "default", "Exam");
    const exam = await Exam.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!exam) return res.status(404).send("Not found");
    res.json(exam);
  } catch (err) {
    console.error("approveExam error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function rejectExam(req, res) {
  try {
    const id = req.params.examId || req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Exam = getModel(req.tenantId || "default", "Exam");
    const exam = await Exam.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!exam) return res.status(404).send("Not found");
    res.json(exam);
  } catch (err) {
    console.error("rejectExam error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getMyUpcoming(req, res) {
  try {
    const user = req.user || {};
    const Exam = getModel(req.tenantId || "default", "Exam");
    const items = await Exam.find({
      createdBy: user.sub || user.user_id || user._id,
    }).lean();
    // compute status (upcoming/active/ended) based on startDate/endDate
    const now = new Date();
    const mapped = items.map((e) => {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end = e.endDate ? new Date(e.endDate) : null;
      let status = "unknown";
      if (start && now < start) status = "upcoming";
      else if (start && end && now >= start && now <= end) status = "active";
      else if (end && now > end) status = "ended";
      return { ...e, computedStatus: status };
    });
    res.json(mapped);
  } catch (err) {
    console.error("getMyUpcoming error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getMyEnrolled(req, res) {
  try {
    const userId = req.user?.sub || req.user?.user_id || req.user?._id;
    if (!userId) return res.status(401).send("Unauthorized");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const Exam = getModel(req.tenantId || "default", "Exam");
    const enrollments = await EnrolledCourse.find({ user: userId }).lean();
    const courseIds = enrollments.map((e) => e.course);
    const exams = await Exam.find({
      course: { $in: courseIds },
      status: "approved",
    }).lean();
    res.json(exams);
  } catch (err) {
    console.error("getMyEnrolled error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createExam,
  listExams,
  getExamById,
  updateExam,
  deleteExam,
  listApprovals,
  approveExam,
  rejectExam,
  getMyUpcoming,
  getMyEnrolled,
};
