/**
 * @openapi
 * /exam/answers:
 *   post:
 *     summary: Create an answer
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
 *             required: [answer, isCorrect]
 *             properties:
 *               answer:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Answer created
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createAnswer,
  listAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
} = require("../controller/answer.controller");

router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  createAnswer
);
/**
 * @openapi
 * /exam/answers:
 *   get:
 *     summary: List answers
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
 *       - name: question
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of answers
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  listAnswers
);
/**
 * @openapi
 * /exam/answers/{id}:
 *   get:
 *     summary: Get an answer by ID
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Answer found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  getAnswerById
);
/**
 * @openapi
 * /exam/answers/{id}:
 *   put:
 *     summary: Update an answer by ID
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
 *         description: Answer updated
 */
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  updateAnswer
);
/**
 * @openapi
 * /exam/answers/{id}:
 *   delete:
 *     summary: Delete an answer by ID
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Answer deleted
 */
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin"]),
  deleteAnswer
);

module.exports = router;
