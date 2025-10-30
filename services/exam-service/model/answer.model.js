const mongoose = require("mongoose");
const joi = require("joi");

const AnswerSchema = new mongoose.Schema({
  answer: String,
  isCorrect: Boolean,
});

// Export schema so tenant-scoped models can be created via getModel
const JoiAnswer = joi.object({
  answer: joi.string().required(),
  isCorrect: joi.boolean().required(),
});

const ValidateJoiSchema = (data) => JoiAnswer.validate(data);

module.exports.AnswerSchema = AnswerSchema;
module.exports.ValidateJoiSchema = ValidateJoiSchema;
