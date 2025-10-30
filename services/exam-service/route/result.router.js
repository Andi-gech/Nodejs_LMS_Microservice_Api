/**
 * @openapi
 * /exam/results:
 *   post:
 *     summary: Create a result
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
 *             required: [user, course]
 *             properties:
 *               user:
 *                 type: string
 *               course:
 *                 type: string
 *               exams:
 *                 type: array
 *               assignments:
 *                 type: array
 *     responses:
 *       201:
 *         description: Result created
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createResult,
  listResults,
  getResultById,
} = require("../controller/result.controller");

router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  createResult
);
/**
 * @openapi
 * /exam/results:
 *   get:
 *     summary: List results
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
 *       - name: courseId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of results
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  listResults
);
/**
 * @openapi
 * /exam/results/{id}:
 *   get:
 *     summary: Get a result by ID
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
 *         description: Result found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "department_admin"]),
  getResultById
);

module.exports = router;
