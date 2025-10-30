import express from "express";
import {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
} from "../controller/tenant.controller";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: "Acme University"
 *         email:
 *           type: string
 *           example: "admin@acme.edu"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           example: "123 Main St, City, Country"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-03T12:00:00.000Z"
 */

/**
 * @openapi
 * /:
 *   post:
 *     summary: Create a new tenant
 *     tags:
 *       - Tenants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       201:
 *         description: Tenant created
 *       400:
 *         description: Invalid input
 */
router.post("/", createTenant);

/**
 * @openapi
 * /:
 *   get:
 *     summary: Get all tenants
 *     tags:
 *       - Tenants
 *     responses:
 *       200:
 *         description: List of tenants
 */
router.get("/", getTenants);

/**
 * @openapi
 * /{id}:
 *   get:
 *     summary: Get a tenant by ID
 *     tags:
 *       - Tenants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant found
 *       404:
 *         description: Tenant not found
 */
router.get("/:id", getTenantById);

/**
 * @openapi
 * /{id}:
 *   put:
 *     summary: Update a tenant by ID
 *     tags:
 *       - Tenants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       200:
 *         description: Tenant updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Tenant not found
 */
router.put("/:id", updateTenant);

/**
 * @openapi
 * /{id}:
 *   delete:
 *     summary: Delete a tenant by ID
 *     tags:
 *       - Tenants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant deleted
 *       404:
 *         description: Tenant not found
 */
router.delete("/:id", deleteTenant);

export default router;
