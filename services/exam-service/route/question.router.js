/**
 * @openapi
 * /exam/questions:
 *   post:
 *     summary: Create a question
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
 *             required: [question, type]
 *             properties:
 *               question:
 *                 type: string
 *               type:
 *                 type: string
 *               mark:
 *                 type: number
 *               answers:
 *                 type: array
 *     responses:
 *       201:
 *         description: Question created
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} = require("../controller/question.controller");

router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  createQuestion
);
/**
 * @openapi
 * /exam/questions:
 *   get:
 *     summary: List questions
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
 *       - name: course
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of questions
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  listQuestions
);
/**
 * @openapi
 * /exam/questions/{id}:
 *   get:
 *     summary: Get a question by id
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
 *         description: Question found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  getQuestionById
);
/**
 * @openapi
 * /exam/questions/{id}:
 *   put:
 *     summary: Update a question
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
 *         description: Question updated
 */
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  updateQuestion
);
/**
 * @openapi
 * /exam/questions/{id}:
 *   delete:
 *     summary: Delete a question
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
 *         description: Question deleted
 */
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin"]),
  deleteQuestion
);

module.exports = router;
