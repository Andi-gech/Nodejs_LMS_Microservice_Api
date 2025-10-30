import express from "express";

import {
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createCourse,
  getInactiveCourses,
  approveCourse,
  scheduleCourse,
  getCourseDetails,
  getDepartmentMine,
  getDepartmentOverviewStats,
  getTeacherCourses,
  registrarCreateCourse,
  assignTeacher,
} from "../controller/CourseController";
import { extractTenantId } from "../middleware/tenant.middleware";

const router = express.Router();

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
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - code
 *       properties:
 *         title:
 *           type: string
 *           example: "Intro to Computer Science"
 *         code:
 *           type: string
 *           example: "CS101"
 *         description:
 *           type: string
 *           example: "An introduction to computer science concepts."
 *         credits:
 *           type: integer
 *           example: 3
 *       example:
 *         title: "Intro to Computer Science"
 *         code: "CS101"
 *         description: "An introduction to computer science concepts."
 *         credits: 3
 *     CourseSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65123456789abcdef0123458"
 *         title:
 *           type: string
 *           example: "Intro to Computer Science"
 *         code:
 *           type: string
 *           example: "CS101"
 *         department:
 *           type: string
 *           example: "65123456789abcdef0123457"
 *         status:
 *           type: boolean
 *           example: true
 *       example:
 *         _id: "65123456789abcdef0123458"
 *         title: "Intro to Computer Science"
 *         code: "CS101"
 *         department: "65123456789abcdef0123457"
 *         status: true
 *     CourseModule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65123456789abcdef0123459"
 *         title:
 *           type: string
 *           example: "Module 1: Basics"
 *     UserSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65123456789abcdef012345a"
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *     CourseDetails:
 *       type: object
 *       properties:
 *         course:
 *           $ref: '#/components/schemas/Course'
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseModule'
 *         enrolledStudents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserSummary'
 *       example:
 *         course:
 *           title: "Intro to Computer Science"
 *           code: "CS101"
 *           description: "An introduction to computer science concepts."
 *           credits: 3
 *         modules:
 *           - _id: "65123456789abcdef0123459"
 *             title: "Module 1: Basics"
 *         enrolledStudents:
 *           - _id: "65123456789abcdef012345a"
 *             name: "Jane Doe"
 */

/**
 * @openapi
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseSummary'
 *       400:
 *         description: Invalid input
 */
router.post("/", extractTenantId, createCourse);

/**
 * @openapi
 * /courses/registrar:
 *   post:
 *     summary: Registrar creates a course (with image upload)
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created by registrar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseSummary'
 */
router.post("/registrar", extractTenantId, registrarCreateCourse);

/**
 * @openapi
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseSummary'
 */
router.get("/", extractTenantId, getCourses);

/**
 * @openapi
 * /courses/inactive:
 *   get:
 *     summary: Get inactive courses
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: List of inactive courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseSummary'
 */
router.get("/inactive", extractTenantId, getInactiveCourses);

/**
 * @openapi
 * /courses/approve/{id}:
 *   put:
 *     summary: Approve a course
 *     tags:
 *       - Courses
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
 *         description: Course approved
 */
router.put("/approve/:id", extractTenantId, approveCourse);

/**
 * @openapi
 * /courses/{courseid}/schedule:
 *   put:
 *     summary: Schedule a course
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: courseid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Course scheduled
 */
router.put("/:courseid/schedule", extractTenantId, scheduleCourse);

/**
 * @openapi
 * /courses/{courseid}/details:
 *   get:
 *     summary: Get detailed course info (modules, enrolled students)
 *     tags:
 *       - Courses
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
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseDetails'
 */
router.get("/:courseid/details", extractTenantId, getCourseDetails);

/**
 * @openapi
 * /courses/department/mine:
 *   get:
 *     summary: Get courses for current user's department
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: Department scoped courses
 */
router.get("/department/mine", extractTenantId, getDepartmentMine);

/**
 * @openapi
 * /courses/department/overview/stats:
 *   get:
 *     summary: Department overview statistics (courses, enrollments, exams)
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: Aggregated stats
 */
router.get(
  "/department/overview/stats",
  extractTenantId,
  getDepartmentOverviewStats
);

/**
 * @openapi
 * /courses/courses:
 *   get:
 *     summary: Get courses for current teacher
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: List of teacher's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseSummary'
 */
router.get("/courses", extractTenantId, getTeacherCourses);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 */
router.get("/:id", extractTenantId, getCourseById);

/**
 * @openapi
 * /courses/{id}:
 *   put:
 *     summary: Update a course by ID
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Course not found
 */
router.put("/:id", extractTenantId, updateCourse);

/**
 * @openapi
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     tags:
 *       - Courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     responses:
 *       200:
 *         description: Course deleted
 *       404:
 *         description: Course not found
 */
router.delete("/:id", extractTenantId, deleteCourse);

/**
 * @openapi
 * /courses/{courseid}/assign-teacher/{teacherid}:
 *   put:
 *     summary: Assign a teacher to a course
 *     tags:
 *       - Courses
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
 *         name: teacherid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher assigned to course
 */
router.put(
  "/:courseid/assign-teacher/:teacherid",
  extractTenantId,
  assignTeacher
);

export default router;
