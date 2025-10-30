const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createExam,
  listExams,
  getExamById,
  updateExam,
  deleteExam,
} = require("../controller/exam.controller");
const {
  submitExam,
  listSubmissions,
  getSubmissionById,
  gradeSubmission,
} = require("../controller/submission.controller");
const {
  listApprovals,
  approveExam,
  rejectExam,
  getMyUpcoming,
  getMyEnrolled,
} = require("../controller/exam.controller");

/**
 * @openapi
 * components:
 *   schemas:
 *     Exam:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         course:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *     ExamSubmission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         exam:
 *           type: string
 *         user:
 *           type: string
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *         totalMarks:
 *           type: number
 *     Result:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         course:
 *           type: string
 *         totalMark:
 *           type: number
 */

/**
 * @openapi
 * /exam:
 *   post:
 *     summary: Create an exam
 *     tags:
 *       - Exam
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Exam object to create. Questions may be provided as array of question IDs or inline objects depending on controller behavior.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, course]
 *             properties:
 *               title:
 *                 type: string
 *               course:
 *                 type: string
 *                 format: objectId
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               examDuration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Exam created
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  createExam
);
/**
 * @openapi
 * /exam:
 *   get:
 *     summary: List exams
 *     tags:
 *       - Exam
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: x-tenant-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of exams
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  listExams
);
/**
 * @openapi
 * /exam/{id}:
 *   get:
 *     summary: Get an exam by ID
 *     tags:
 *       - Exam
 *     parameters:
 *       - name: x-tenant-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  getExamById
);
/**
 * @openapi
 * /exam/{id}:
 *   put:
 *     summary: Update an exam
 *     tags:
 *       - Exam
 *     parameters:
 *       - name: x-tenant-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Exam updated
 */
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  updateExam
);
/**
 * @openapi
 * /exam/{id}:
 *   delete:
 *     summary: Delete an exam
 *     tags:
 *       - Exam
 *     parameters:
 *       - name: x-tenant-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam deleted
 */
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin"]),
  deleteExam
);

// Exams approvals listing
router.get(
  "/approvals",
  extractTenantId,
  checkJwt,
  requireRole(["department_head", "department_admin", "teacher"]),
  listApprovals
);

// Approve/reject exam
router.post(
  "/:examId/approve",
  extractTenantId,
  checkJwt,
  requireRole(["department_head", "department_admin"]),
  approveExam
);
router.post(
  "/:examId/reject",
  extractTenantId,
  checkJwt,
  requireRole(["department_head", "department_admin"]),
  rejectExam
);

// Submit exam (alias) - POST /exam/:examId/submit
router.post(
  "/:examId/submit",
  extractTenantId,
  checkJwt,
  requireRole(["student"]),
  // middleware to attach examId to body then call submitExam
  (req, _res, next) => {
    req.body = req.body || {};
    req.body.exam = req.params.examId;
    next();
  },
  submitExam
);

// GET /exam/:examId/submissions -> list submissions for an exam (teacher)
/**
 * @openapi
 * /exam/{examId}/submissions:
 *   get:
 *     summary: List submissions for an exam
 *     tags:
 *       - Exam
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: x-tenant-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - name: examId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
  "/:examId/submissions",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  (req, _res, next) => {
    req.query = req.query || {};
    req.query.exam = req.params.examId;
    next();
  },
  listSubmissions
);

// GET /exam/:examId/submissions/:submissionId
router.get(
  "/:examId/submissions/:submissionId",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  (req, _res, next) => {
    req.params.id = req.params.submissionId;
    next();
  },
  getSubmissionById
);

// POST /exam/:examId/submissions/:submissionId/grade
router.post(
  "/:examId/submissions/:submissionId/grade",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  (req, _res, next) => {
    req.params.id = req.params.submissionId;
    next();
  },
  gradeSubmission
);

// GET /exam/my/upcoming
router.get(
  "/my/upcoming",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  getMyUpcoming
);

// GET /exam/my/enrolled
router.get(
  "/my/enrolled",
  extractTenantId,
  checkJwt,
  requireRole(["student"]),
  getMyEnrolled
);

module.exports = router;
