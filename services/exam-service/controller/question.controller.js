const { ValidateJoiSchema } = require("../model/question.model");
const { getModel } = require("../model/getModel");

async function createQuestion(req, res) {
  try {
    const { error } = ValidateJoiSchema(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const Question = getModel(req.tenantId || "default", "Question");
    const q = await Question.create(req.body);
    res.status(201).json(q);
  } catch (err) {
    console.error("Error creating question", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listQuestions(req, res) {
  try {
    const Question = getModel(req.tenantId || "default", "Question");
    const items = await Question.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing questions", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getQuestionById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Question = getModel(req.tenantId || "default", "Question");
    const item = await Question.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching question", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateQuestion(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Question = getModel(req.tenantId || "default", "Question");
    const updated = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("Error updating question", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteQuestion(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Question = getModel(req.tenantId || "default", "Question");
    const del = await Question.findByIdAndDelete(id);
    res.json(del);
  } catch (err) {
    console.error("Error deleting question", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
