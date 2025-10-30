/**
 * @openapi
 * /departments:
 *   post:
 *     summary: Create a department
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controller/department.controller");

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
 *     Department:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @openapi
 * /departments:
 *   post:
 *     summary: Create a department
 *     tags:
 *       - Departments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       201:
 *         description: Department created
 */
router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole("department_admin"),
  createDepartment
);

/**
 * @openapi
 * /departments:
 *   get:
 *     summary: List departments
 *     tags:
 *       - Departments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin", "Registrar"]),
  listDepartments
);

/**
 * @openapi
 * /departments/{id}:
 *   get:
 *     summary: Get a department by id
 *     tags:
 *       - Departments
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
 *         description: Department found
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole(["department_admin", "Registrar"]),
  getDepartmentById
);

/**
 * @openapi
 * /departments/{id}:
 *   put:
 *     summary: Update a department
 *     tags:
 *       - Departments
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
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: Department updated
 */
router.put(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole("department_admin"),
  updateDepartment
);

/**
 * @openapi
 * /departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags:
 *       - Departments
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
 *         description: Department deleted
 */
router.delete(
  "/:id",
  extractTenantId,
  checkJwt,
  requireRole("department_admin"),
  deleteDepartment
);

// PUT /departments/:deptId/assign-head/:userId
router.put(
  "/:deptId/assign-head/:userId",
  extractTenantId,
  checkJwt,
  requireRole("Registrar"),
  /**
   * @openapi
   * /departments/{deptId}/assign-head/{userId}:
   *   put:
   *     summary: Assign a department head
   *     tags:
   *       - Departments
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: deptId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Department head assigned
   */
  async (req, res) => {
    // delegate to controller file to keep logic centralized
    const controller = require("../controller/department.controller");
    return controller.assignHead(req, res);
  }
);

module.exports = router;
