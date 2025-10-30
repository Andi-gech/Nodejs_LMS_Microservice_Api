/**
 * @openapi
 * /exam/submissions:
 *   post:
 *     summary: Submit an exam
 *     tags:
 *       - Exam
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [exam, user, answers]
 *             properties:
 *               exam:
 *                 type: string
 *                 format: objectId
 *               user:
 *                 type: string
 *                 format: objectId
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Submission created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSubmission'
 *             example:
 *               _id: "65123456789abcdef0123460"
 *               exam: "65123456789abcdef0123461"
 *               user: "65123456789abcdef0123462"
 *               answers: []
 *       400:
 *         description: Validation error
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  submitExam,
  listSubmissions,
  getSubmissionById,
  gradeSubmission,
} = require("../controller/submission.controller");

router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  submitExam
);
/**
 * @openapi
 * /exam/submissions:
 *   get:
 *     summary: List submissions
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
 *       - name: exam
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  listSubmissions
);
/**
 * @openapi
 * /exam/submissions/{id}:
 *   get:
 *     summary: Get a submission by ID
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
 *         description: Submission found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  getSubmissionById
);
/**
 * @openapi
 * /exam/submissions/{id}/grade:
 *   post:
 *     summary: Grade a submission
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
 *             properties:
 *               grade:
 *                 type: number
 *     responses:
 *       200:
 *         description: Submission graded
 */
router.post(
  "/:id/grade",
  extractTenantId,
  checkJwt,
  requireRole(["teacher"]),
  gradeSubmission
);

module.exports = router;
