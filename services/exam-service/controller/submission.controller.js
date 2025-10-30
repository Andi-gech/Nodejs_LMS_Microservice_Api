const { getModel } = require("../model/getModel");

async function submitExam(req, res) {
  try {
    const payload = req.body;
    // Ensure uniqueness: exam + user
    const ExamSubmission = getModel(
      req.tenantId || "default",
      "ExamSubmission"
    );
    const existing = await ExamSubmission.findOne({
      exam: payload.exam,
      user: payload.user,
    });
    if (existing)
      return res.status(400).json({ error: "Submission already exists" });
    const s = await ExamSubmission.create(payload);
    // publish submission.created (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "submission.created",
          tenantId: req.tenantId || "default",
          submissionId: s._id.toString(),
          exam: s.exam,
          user: s.user,
        };
        await sendMessage(defaultTopic, event);
      } catch (err) {
        console.error(
          "Failed to publish submission.created",
          err && err.message
        );
      }
    })();
    res.status(201).json(s);
  } catch (err) {
    console.error("Error creating submission", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listSubmissions(req, res) {
  try {
    const ExamSubmission = getModel(
      req.tenantId || "default",
      "ExamSubmission"
    );
    const items = await ExamSubmission.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing submissions", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getSubmissionById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const ExamSubmission = getModel(
      req.tenantId || "default",
      "ExamSubmission"
    );
    const item = await ExamSubmission.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching submission", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function gradeSubmission(req, res) {
  try {
    const id = req.params.id;
    const { manualScore } = req.body;
    const ExamSubmission = getModel(
      req.tenantId || "default",
      "ExamSubmission"
    );
    const sub = await ExamSubmission.findById(id);
    if (!sub) return res.status(404).send("Not found");
    sub.manualScore = manualScore;
    sub.status = "graded";
    await sub.save();
    // publish submission.graded (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "submission.graded",
          tenantId: req.tenantId || "default",
          submissionId: sub._id.toString(),
          manualScore,
        };
        await sendMessage(defaultTopic, event);
      } catch (err) {
        console.error(
          "Failed to publish submission.graded",
          err && err.message
        );
      }
    })();
    res.json(sub);
  } catch (err) {
    console.error("Error grading submission", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  submitExam,
  listSubmissions,
  getSubmissionById,
  gradeSubmission,
};
