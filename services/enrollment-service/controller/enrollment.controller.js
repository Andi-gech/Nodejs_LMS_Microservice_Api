const { validateEnrolledCourse } = require("../model/enrolledCourse.model");
const { getModel } = require("../model/getModel");

async function createEnrollment(req, res) {
  try {
    const { error } = validateEnrolledCourse(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const payload = req.body;
    // Optionally set enrolledBy to the current user if present
    if (!payload.enrolledBy && req.user && req.user.sub)
      payload.enrolledBy = req.user.sub;
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const e = await EnrolledCourse.create(payload);
    // publish enrollment.created (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "enrollment.created",
          tenantId: req.tenantId || "default",
          enrollmentId: e._id.toString(),
          course: e.course,
        };
        await sendMessage(defaultTopic, event);
      } catch (err) {
        console.error(
          "Failed to publish enrollment.created",
          err && err.message
        );
      }
    })();
    res.status(201).json(e);
  } catch (err) {
    console.error("Error creating enrollment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listEnrollments(req, res) {
  try {
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const items = await EnrolledCourse.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing enrollments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getEnrollmentById(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const item = await EnrolledCourse.findById(id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err) {
    console.error("Error fetching enrollment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateEnrollment(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const updated = await EnrolledCourse.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err) {
    console.error("Error updating enrollment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteEnrollment(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const del = await EnrolledCourse.findByIdAndDelete(id);
    res.json(del);
  } catch (err) {
    console.error("Error deleting enrollment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createEnrollment,
  listEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
};

// POST /enrollments/payinfo/verify
async function verifyPayInfo(req, res) {
  try {
    // parse chapa callback/meta and create EnrolledCourse + Notification
    const meta = req.body;
    // For now, create a basic enrolled record if course and user present
    const { course, user } = meta;
    if (!course || !user)
      return res.status(400).json({ error: "course and user required" });
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const e = await EnrolledCourse.create({ course, user, enrolledBy: user });
    res.json({ ok: true, enrolled: e });
  } catch (err) {
    console.error("verifyPayInfo error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /enrollments/with-progress
async function withProgress(req, res) {
  try {
    if (!req.user || !(req.user.sub || req.user.user_id))
      return res.status(401).send("Unauthorized");
    const userId = req.user.sub || req.user.user_id;
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const items = await EnrolledCourse.find({ user: userId }).lean();
    // Add progress percent stub (0..100)
    const enriched = items.map((it) => ({ ...it, progress: 0 }));
    res.json(enriched);
  } catch (err) {
    console.error("withProgress error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /enrollments/:courseid/modules/progress
async function modulesProgress(req, res) {
  try {
    const courseId = req.params.courseid;
    if (!require("mongoose").isValidObjectId(courseId))
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const enrollment = await EnrolledCourse.findOne({
      course: courseId,
      user: req.user?.sub || req.user?.user_id,
    });
    if (!enrollment) return res.status(404).send("Not enrolled");
    const CourseModule = getModel(req.tenantId || "default", "CourseModule");
    const modules = await CourseModule.find({ course: courseId })
      .sort({ order: 1 })
      .lean();
    // mark completed sequentially based on enrolled.completedModules
    const completedIds = (enrollment.completedModules || []).map((c) =>
      String(c.id)
    );
    const result = modules.map((m) => ({
      ...m,
      completed: completedIds.includes(String(m._id)),
    }));
    res.json(result);
  } catch (err) {
    console.error("modulesProgress error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /enrollments/:courseid/module/:moduleid
async function moduleDetail(req, res) {
  try {
    const { courseid, moduleid } = req.params;
    if (
      !require("mongoose").isValidObjectId(courseid) ||
      !require("mongoose").isValidObjectId(moduleid)
    )
      return res.status(400).send("Invalid id");
    const CourseModule = getModel(req.tenantId || "default", "CourseModule");
    const mod = await CourseModule.findById(moduleid).lean();
    if (!mod) return res.status(404).send("Module not found");
    // students only see approved modules
    if (
      mod.status &&
      mod.status !== "approved" &&
      !(req.user && (req.user.realm_access?.roles || []).includes("teacher"))
    ) {
      return res.status(403).send("Forbidden");
    }
    res.json(mod);
  } catch (err) {
    console.error("moduleDetail error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// POST /enrollments/pay/:id
async function payInit(req, res) {
  try {
    // stub: would call myChapa.initialize
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    res.json({
      ok: true,
      chapaInit: { paymentUrl: "https://chapa.example/checkout" },
    });
  } catch (err) {
    console.error("payInit error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// POST /enrollments/assign/:courseId/:studentId
async function assignStudent(req, res) {
  try {
    const { courseId, studentId } = req.params;
    if (
      !require("mongoose").isValidObjectId(courseId) ||
      !require("mongoose").isValidObjectId(studentId)
    )
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const exists = await EnrolledCourse.findOne({
      course: courseId,
      user: studentId,
    });
    if (exists) return res.status(400).json({ error: "Already enrolled" });
    const e = await EnrolledCourse.create({
      course: courseId,
      user: studentId,
      enrolledBy: req.user?.sub || req.user?.user_id,
    });
    res.status(201).json(e);
  } catch (err) {
    console.error("assignStudent error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// DELETE /enrollments/assign/:courseId/:studentId
async function unassignStudent(req, res) {
  try {
    const { courseId, studentId } = req.params;
    if (
      !require("mongoose").isValidObjectId(courseId) ||
      !require("mongoose").isValidObjectId(studentId)
    )
      return res.status(400).send("Invalid id");
    const EnrolledCourse = getModel(
      req.tenantId || "default",
      "EnrolledCourse"
    );
    const del = await EnrolledCourse.findOneAndDelete({
      course: courseId,
      user: studentId,
    });
    res.json({ ok: true, deleted: del });
  } catch (err) {
    console.error("unassignStudent error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports.verifyPayInfo = verifyPayInfo;
module.exports.withProgress = withProgress;
module.exports.modulesProgress = modulesProgress;
module.exports.moduleDetail = moduleDetail;
module.exports.payInit = payInit;
module.exports.assignStudent = assignStudent;
module.exports.unassignStudent = unassignStudent;
