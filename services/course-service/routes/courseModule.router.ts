/**
 * @openapi
 * /courses/modules:
 *   post:
 *     summary: Create a course module
 */
// ...existing code...
import express, { Request, Response } from "express";
import multer from "multer";
import { extractTenantId } from "../middleware/tenant.middleware";
import path from "path";
import { getModel } from "../model/getModel";
import { authenticate } from "../middleware/Authenticate";
import { checkJwt, requireRole } from "../middleware/jwksAuth";
import {
  createCourseModule,
  deleteCourseModule,
  updateCourseModule,
  listApprovals,
  listByCourse,
  getModuleById,
  approveModule,
  rejectModule,
} from "../controller/courseModule.controller";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: { originalname: string; filename: string },
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, "public/uploads/catagory");
  },
  filename: (
    _req: Request,
    file: { originalname: string; filename: string },
    cb: (err: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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
 *     CourseModule:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         content:
 *           type: string
 *         videolink:
 *           type: string
 *         linkUrl:
 *           type: string
 *         type:
 *           type: string
 *           enum: [text, video, link, file]
 */

// Routes: delegate to controller functions; keep middleware order consistent with other routers

router.post(
  "/:courseid/create",
  checkJwt,
  requireRole("teacher"),
  upload.single("video"),
  /**
   * @openapi
   * /coursemodule/{courseid}/create:
   *   post:
   *     summary: Create a course module for a course
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: courseid
   *         required: true
   *         schema:
   *           type: string
   *         description: Course id
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               content:
   *                 type: string
   *               video:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Module created
   *       400:
   *         description: Invalid input
   */
  createCourseModule
);

router.delete(
  "/:courseid/delete/:id",
  checkJwt,
  requireRole("teacher"),
  /**
   * @openapi
   * /coursemodule/{courseid}/delete/{id}:
   *   delete:
   *     summary: Delete a course module by id
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: courseid
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
   *         description: Module deleted
   *       404:
   *         description: Module not found
   */
  deleteCourseModule
);

router.put(
  "/:courseid/update/:id",

  checkJwt,
  requireRole("teacher"),
  upload.single("video"),
  /**
   * @openapi
   * /coursemodule/{courseid}/update/{id}:
   *   put:
   *     summary: Update a course module
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: courseid
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
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               content:
   *                 type: string
   *               video:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Module updated
   *       400:
   *         description: Invalid input
   */
  updateCourseModule
);

router.get(
  "/approvals",
  checkJwt,
  requireRole(["department_head", "department_admin"]),
  /**
   * @openapi
   * /coursemodule/approvals:
   *   get:
   *     summary: List modules needing approval
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status (pending/approved/rejected)
   *       - in: query
   *         name: course
   *         schema:
   *           type: string
   *         description: Course id filter
   *     responses:
   *       200:
   *         description: List of modules
   */
  listApprovals
);

router.get(
  "/course/:courseid",
  checkJwt,
  requireRole(["Registrar", "teacher", "department_head", "department_admin"]),
  /**
   * @openapi
   * /coursemodule/course/{courseid}:
   *   get:
   *     summary: Get modules for a course
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: courseid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of modules
   */
  listByCourse
);

router.get(
  "/:moduleid",
  checkJwt,
  requireRole(["Registrar", "teacher", "department_head", "department_admin"]),
  /**
   * @openapi
   * /coursemodule/{moduleid}:
   *   get:
   *     summary: Get a module by id
   *     tags:
   *       - CourseModule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/TenantIdHeader'
   *       - in: path
   *         name: moduleid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Module found
   *       404:
   *         description: Module not found
   */
  getModuleById
);

router.post(
  "/:id/approve",

  checkJwt,
  requireRole(["department_head", "department_admin"]),
  /**
   * @openapi
   * /coursemodule/{id}/approve:
   *   post:
   *     summary: Approve a course module
   *     tags:
   *       - CourseModule
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
   *         description: Module approved
   *       404:
   *         description: Module not found
   */
  approveModule
);

router.post(
  "/:id/reject",

  checkJwt,
  requireRole(["department_head", "department_admin"]),
  /**
   * @openapi
   * /coursemodule/{id}/reject:
   *   post:
   *     summary: Reject a course module
   *     tags:
   *       - CourseModule
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
   *         description: Module rejected
   *       404:
   *         description: Module not found
   */
  rejectModule
);

export default router;
