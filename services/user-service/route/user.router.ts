import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
  getMe,
  updateMe,
  changePassword,
  getTeachers,
  getStudents,
  rateUser,
} from "../controller/user.controller";

import { checkJwt } from "../middleware/jwksAuth";

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
 *     UserRegister:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *         - role
 *         - confirmpassword
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           example: "Password123!"
 *         confirmpassword:
 *           type: string
 *           example: "Password123!"
 *         role:
 *           type: string
 *           example: "student"
 *         department:
 *           type: string
 *           example: "65123456789abcdef0123456"
 *         profilepic:
 *           type: string
 *           example: "https://example.com/profile.jpg"
 *         status:
 *           type: boolean
 *           example: false
    User:
      type: object
      properties:
        _id:
          type: string
          example: "65123456789abcdef0123456"
        fullName:
          type: string
          example: "John Doe"
        email:
          type: string
          example: "john@example.com"
        role:
          type: string
          example: "student"
        department:
          type: string
          example: "65123456789abcdef0123457"
        profilepic:
          type: string
          example: "https://example.com/profile.jpg"
        status:
          type: boolean
          example: true
        averageRating:
          type: number
          example: 4.5
    UserSummary:
      type: object
      properties:
        id:
          type: string
          example: "65123456789abcdef0123456"
        name:
          type: string
          example: "John Doe"
        role:
          type: string
          example: "student"
    LoginResponse:
      type: object
      properties:
        token:
          type: string
          example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
        role:
          type: string
          example: "student"
        name:
          type: string
          example: "John Doe"
        id:
          type: string
          example: "65123456789abcdef0123456"
        department:
          type: string
          example: "65123456789abcdef0123457"
        pic:
          type: string
          example: "https://example.com/profile.jpg"
        email:
          type: string
          example: "john@example.com"
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           example: "Password123!"
 */

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Invalid input
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);

/**
 * @openapi
 * /:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: List of users
 */
// GET /api/users
router.get("/", checkJwt, getUsers);

// GET /api/users/teachers
/**
 * @openapi
 * /users/teachers:
 *   get:
 *     summary: Get teachers
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Optional department filter
 *     responses:
 *       200:
 *         description: List of teachers (sorted by averageRating)
 */
router.get("/teachers", checkJwt, getTeachers);

// GET /api/users/students
/**
 * @openapi
 * /users/students:
 *   get:
 *     summary: Get students
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Optional department filter
 *     responses:
 *       200:
 *         description: List of students
 */
router.get("/students", checkJwt, getStudents);

// GET /api/users/me
/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     responses:
 *       200:
 *         description: Current user profile (password omitted)
 */
router.get("/me", checkJwt, getMe);

/**
 * @openapi
 * /{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
// GET /api/users/:id
// router.get("/:id", checkJwt, getUserById);

/**
 * @openapi
 * /{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
// PUT /api/users/update/:id (keeps backward-compatible path)
router.put("/update/:id", checkJwt, updateUser);

// PUT /api/users/me
/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Update current user's profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               profilepic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user profile
 */
router.put("/me", checkJwt, updateMe);

// PUT /api/users/me/password
/**
 * @openapi
 * /users/me/password:
 *   put:
 *     summary: Change current user's password
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation failed
 */
router.put("/me/password", checkJwt, changePassword);

/**
 * @openapi
 * /{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
// DELETE /api/users/:id
router.delete("/:id", checkJwt, deleteUser);

// PUT /api/users/:id/rate
/**
 * @openapi
 * /users/{id}/rate:
 *   put:
 *     summary: Rate a user
 *     tags:
 *       - Users
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: User rated
 */
router.put("/:id/rate", checkJwt, rateUser);

router.get("/verify-email", checkJwt, verifyEmail);

export default router;
