const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const { extractTenantId } = require("../middleware/tenant.middleware");
const controller = require("../controller/assignment.controller");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "public/uploads/assignments"),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.createAssignment
);
router.get("/", extractTenantId, checkJwt, controller.listAssignments);
router.get(
  "/my",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.listMyAssignments
);
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.updateAssignment
);
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.deleteAssignment
);
router.get(
  "/:id/submissions",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.listAssignmentSubmissions
);
router.get(
  "/course/:courseId",
  extractTenantId,
  checkJwt,
  controller.listByCourse
);
router.get("/:id", extractTenantId, checkJwt, controller.getAssignmentById);
router.post(
  "/:id/submit",
  extractTenantId,
  checkJwt,
  requireRole(["student"]),
  upload.single("file"),
  controller.submitAssignment
);
router.post(
  "/:id/grade/:studentId",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  controller.gradeAssignment
);

module.exports = router;
