const { getModel } = require("../model/getModel");
const { JoiNotification } = require("../model/notification.model");

async function createNotification(req, res) {
  try {
    const { error } = JoiNotification.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    const Notification = getModel(req.tenantId || "default", "Notification");
    const n = await Notification.create(req.body);
    // publish notification.created event (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "notification.created",
          tenantId: req.tenantId || "default",
          notificationId: n._id.toString(),
          user: n.user,
        };
        await sendMessage(defaultTopic, event);
      } catch (err) {
        console.error(
          "Failed to publish notification.created",
          err && err.message
        );
      }
    })();
    res.status(201).json(n);
  } catch (err) {
    console.error("Error creating notification", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listNotifications(req, res) {
  try {
    const Notification = getModel(req.tenantId || "default", "Notification");
    const items = await Notification.find({}).lean();
    res.json(items);
  } catch (err) {
    console.error("Error listing notifications", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { createNotification, listNotifications };

async function markAsRead(req, res) {
  try {
    const id = req.params.id;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const Notification = getModel(req.tenantId || "default", "Notification");
    const n = await Notification.findById(id);
    if (!n) return res.status(404).send("Not found");
    // Only mark as read for intended user or allow admins
    const userId = req.user?.sub || req.user?.user_id || req.user?._id;
    if (
      n.user &&
      String(n.user) !== String(userId) &&
      !(req.user?.realm_access?.roles || []).includes("admin")
    ) {
      return res.status(403).send("Forbidden");
    }
    n.isRead = true;
    await n.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("markAsRead error", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports.markAsRead = markAsRead;
