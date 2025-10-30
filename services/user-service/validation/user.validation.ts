import Joi from "joi";

const roles = [
  "Registrar",
  "student",
  "teacher",
  "short_training_office",
  "short_training_department",
  "department_head",
  "department_admin",
];

export const userRegisterSchema = Joi.object({
  fullName: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "string.empty": "Password cannot be empty.",
      "any.required": "Password is required.",
    }),
  confirmpassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match",
  }),
  role: Joi.string()
    .valid(...roles)
    .required(),
  department: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null, ""),
  profilepic: Joi.string().allow(""),
  status: Joi.boolean(),
});

export const userAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "string.empty": "Password cannot be empty.",
      "any.required": "Password is required.",
    }),
});

export const validateUserRegister = (data: any) =>
  userRegisterSchema.validate(data, { abortEarly: false });
export const validateUserAuth = (data: any) =>
  userAuthSchema.validate(data, { abortEarly: false });
