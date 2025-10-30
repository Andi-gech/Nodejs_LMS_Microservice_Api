const { validateResult } = require("../model/result.model");
const { getModel } = require("../model/getModel");

async function createResult(req, res) {
  try {
    const { error } = validateResult(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const Result = getModel(req.tenantId || "default", "Result");
    const r = await Result.create(req.body);
    res.status(201).json(r);
  } catch (err) {
    console.error("Error creating result", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listResults(req, res) {
  try {
    const Result = getModel(req.tenantId || "default", "Result");
    const items = await Result.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing results", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getResultById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Result = getModel(req.tenantId || "default", "Result");
    const item = await Result.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching result", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { createResult, listResults, getResultById };
