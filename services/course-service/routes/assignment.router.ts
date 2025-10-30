import express from "express";
import multer from "multer";
import path from "path";
import { extractTenantId } from "../middleware/tenant.middleware";
import { checkJwt, requireRole } from "../middleware/jwksAuth";
import {
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
} from "../controller/assignment.controller";

const router = express.Router();

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
  createAssignment
);
router.get("/", extractTenantId, checkJwt, listAssignments);
router.get(
  "/my",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  listMyAssignments
);
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  updateAssignment
);
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  deleteAssignment
);
router.get(
  "/:id/submissions",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  listAssignmentSubmissions
);
router.get("/course/:courseId", extractTenantId, checkJwt, listByCourse);
router.get("/:id", extractTenantId, checkJwt, getAssignmentById);
router.post(
  "/:id/submit",
  extractTenantId,
  checkJwt,
  requireRole(["student"]),
  upload.single("file"),
  submitAssignment
);
router.post(
  "/:id/grade/:studentId",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  gradeAssignment
);

export default router;
