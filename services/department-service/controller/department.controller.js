const { getModel } = require("../model/getModel");

async function createDepartment(req, res) {
  try {
    const body = req.body;
    const Department = getModel(req.tenantId || "default", "Department");
    const dept = await Department.create(body);
    // publish department.created event (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const payload = {
          event: "department.created",
          tenantId: req.tenantId || "default",
          department: { id: dept._id.toString(), name: dept.name },
        };
        await sendMessage(defaultTopic, payload);
      } catch (e) {
        console.error("Failed to publish department.created", e && e.message);
      }
    })();
    res.status(201).json(dept);
  } catch (err) {
    console.error("Error creating department", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listDepartments(req, res) {
  try {
    const Department = getModel(req.tenantId || "default", "Department");
    const depts = await Department.find({}).lean();
    res.json(depts);
  } catch (err) {
    console.error("Error listing departments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getDepartmentById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Department = getModel(req.tenantId || "default", "Department");
    const dept = await Department.findById(id).lean();
    if (!dept) return res.status(404).send("Not found");
    res.json(dept);
  } catch (err) {
    console.error("Error fetching department", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateDepartment(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Department = getModel(req.tenantId || "default", "Department");
    const updated = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("Error updating department", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteDepartment(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Department = getModel(req.tenantId || "default", "Department");
    const del = await Department.findByIdAndDelete(id);
    res.json(del);
  } catch (err) {
    console.error("Error deleting department", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};

async function assignHead(req, res) {
  try {
    const { deptId, userId } = req.params;
    if (!require("mongoose").isValidObjectId(deptId))
      return res.status(400).send("Invalid deptId");
    if (!require("mongoose").isValidObjectId(userId))
      return res.status(400).send("Invalid userId");
    const Department = getModel(req.tenantId || "default", "Department");
    const User = getModel(req.tenantId || "default", "User");
    const dept = await Department.findById(deptId);
    if (!dept) return res.status(404).send("Department not found");
    dept.head = userId;
    await dept.save();
    // update user role to department_head
    await User.findByIdAndUpdate(userId, {
      role: "department_head",
      department: deptId,
    });
    res.json({ ok: true, department: dept });
  } catch (err) {
    console.error("Error assigning head", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports.assignHead = assignHead;
