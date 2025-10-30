const mongoose = require("mongoose");
const joi = require("joi");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ["multiple_choice", "blank"], required: true },
  mark: { type: Number, required: true },
  answers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer",
      },
    ],
    required: function () {
      return this.type === "multiple_choice";
    },
    default: undefined,
  },
  blankAnswer: {
    type: String,
    required: function () {
      return this.type === "blank";
    },
  },
});

// Export schema so tenant-scoped models can be created via getModel
const JoiQuestion = joi.object({
  question: joi.string().required(),
  mark: joi.number().required(),
  type: joi.string().valid("multiple_choice", "blank").required(),
  answers: joi
    .array()
    .items(joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .when("type", {
      is: "multiple_choice",
      then: joi.required(),
      otherwise: joi.forbidden(),
    }),
  blankAnswer: joi
    .string()
    .when("type", {
      is: "blank",
      then: joi.required(),
      otherwise: joi.forbidden(),
    }),
});

const ValidateJoiSchema = (data) => JoiQuestion.validate(data);

module.exports.QuestionSchema = QuestionSchema;
module.exports.ValidateJoiSchema = ValidateJoiSchema;
