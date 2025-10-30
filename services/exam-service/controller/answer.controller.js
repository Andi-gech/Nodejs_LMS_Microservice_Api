const { ValidateJoiSchema } = require("../model/answer.model");
const { getModel } = require("../model/getModel");

async function createAnswer(req, res) {
  try {
    const { error } = ValidateJoiSchema(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const Answer = getModel(req.tenantId || "default", "Answer");
    const a = await Answer.create(req.body);
    res.status(201).json(a);
  } catch (err) {
    console.error("Error creating answer", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listAnswers(req, res) {
  try {
    const Answer = getModel(req.tenantId || "default", "Answer");
    const items = await Answer.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing answers", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAnswerById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Answer = getModel(req.tenantId || "default", "Answer");
    const item = await Answer.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching answer", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateAnswer(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Answer = getModel(req.tenantId || "default", "Answer");
    const updated = await Answer.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("Error updating answer", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteAnswer(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Answer = getModel(req.tenantId || "default", "Answer");
    const del = await Answer.findByIdAndDelete(id);
    res.json(del);
  } catch (err) {
    console.error("Error deleting answer", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createAnswer,
  listAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
};
