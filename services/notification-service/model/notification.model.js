const mongoose = require("mongoose");
const joi = require("joi");

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["info", "success", "warning", "error"],
    default: "info",
  },
  description: String,
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const JoiNotification = joi.object({
  type: joi.string().required(),
  description: joi.string().required(),
  date: joi.date(),
  isRead: joi.boolean(),
  user: joi.string().required(),
});

module.exports = { NotificationSchema, JoiNotification };
