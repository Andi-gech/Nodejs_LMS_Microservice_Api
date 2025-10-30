/**
 * @openapi
 * /enrollments:
 *   post:
 *     summary: Create an enrollment
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createEnrollment,
  listEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  verifyPayInfo,
  withProgress,
  modulesProgress,
  moduleDetail,
  payInit,
  assignStudent,
  unassignStudent,
} = require("../controller/enrollment.controller");

/**
 * @openapi
 * components:
 *   parameters:
 *     TenantIdHeader:
 *       name: x-tenant-id
 *       in: header
 *       required: true
 *       description: Tenant ID for multi-tenant DB routing
 *       schema:
 *         type: string
 *   schemas:
 *     EnrolledCourse:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *         course:
 *           type: string
 *     PaymentInit:
 *       type: object
 *       properties:
 *         paymentUrl:
 *           type: string
 *           example: "https://chapa.example/pay/abc123"
 *     EnrolledCourseList:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/EnrolledCourse'
 */
/**
 * @openapi
 * /enrollments:
 *   post:
 *     summary: Create an enrollment
 *     tags:
 *       - Enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrolledCourse'
 *     responses:
 *       201:
 *         description: Enrollment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnrolledCourse'
 */
router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  createEnrollment
);

// POST /enrollments/payinfo/verify
router.post("/payinfo/verify", extractTenantId, verifyPayInfo);

// GET /enrollments/with-progress
router.get(
  "/with-progress",
  extractTenantId,
  checkJwt,
  requireRole(["student"]),
  withProgress
);

// GET /enrollments/:courseid/modules/progress
router.get(
  "/:courseid/modules/progress",
  extractTenantId,
  checkJwt,
  modulesProgress
);

// GET /enrollments/:courseid/module/:moduleid
router.get(
  "/:courseid/module/:moduleid",
  extractTenantId,
  checkJwt,
  moduleDetail
);

// POST /enrollments/pay/:id
router.post("/pay/:id", extractTenantId, checkJwt, payInit);

// POST /enrollments/assign/:courseId/:studentId
router.post(
  "/assign/:courseId/:studentId",
  extractTenantId,
  checkJwt,
  requireRole(["short_training_office"]),
  assignStudent
);

// DELETE /enrollments/assign/:courseId/:studentId
router.delete(
  "/assign/:courseId/:studentId",
  extractTenantId,
  checkJwt,
  requireRole(["short_training_office"]),
  unassignStudent
);
/**
 * @openapi
 * /enrollments:
 *   get:
 *     summary: List enrollments
 *     tags:
 *       - Enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user id
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by course id
 *     responses:
 *       200:
 *         description: List of enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnrolledCourse'
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  listEnrollments
);

/**
 * @openapi
 * /enrollments/{id}:
 *   get:
 *     summary: Get an enrollment by ID
 *     tags:
 *       - Enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnrolledCourse'
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  getEnrollmentById
);

/**
 * @openapi
 * /enrollments/{id}:
 *   put:
 *     summary: Update an enrollment by ID
 *     tags:
 *       - Enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrolledCourse'
 *     responses:
 *       200:
 *         description: Enrollment updated
 */
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["teacher", "Registrar"]),
  updateEnrollment
);

/**
 * @openapi
 * /enrollments/{id}:
 *   delete:
 *     summary: Delete an enrollment by ID
 *     tags:
 *       - Enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment deleted
 */
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin"]),
  deleteEnrollment
);

module.exports = router;
