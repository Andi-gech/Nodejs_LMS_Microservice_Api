/**
 * @openapi
 * /notifications:
 *   post:
 *     summary: Create a notification
 */
const express = require("express");
const router = express.Router();
const { extractTenantId } = require("../middleware/tenant.middleware");
const { checkJwt, requireRole } = require("../middleware/jwksAuth");
const {
  createNotification,
  listNotifications,
} = require("../controller/notification.controller");

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
 *     Notification:
 *       type: object
 *       required:
 *         - type
 *         - description
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [info, success, warning, error]
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         isRead:
 *           type: boolean
 *         user:
 *           type: string
 */

/**
 * @openapi
 * /notifications:
 *   post:
 *     summary: Create a notification
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 */
router.post(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["admin", "notification_admin"]),
  createNotification
);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List notifications
 *     tags:
 *       - Notifications
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
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  "/",
  extractTenantId,
  checkJwt,
  requireRole(["admin", "notification_admin"]),
  listNotifications
);

// POST /notifications/:id/read
router.post("/:id/read", extractTenantId, checkJwt, async (req, res) => {
  const controller = require("../controller/notification.controller");
  return controller.markAsRead(req, res);
});
/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
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
 *         description: Notification marked as read
 */
// POST /notifications/:id/read
router.post("/:id/read", extractTenantId, checkJwt, async (req, res) => {
  const controller = require("../controller/notification.controller");
  return controller.markAsRead(req, res);
});

module.exports = router;
