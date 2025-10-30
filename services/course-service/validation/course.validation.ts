import JoiBase, { CustomHelpers } from "joi";
import joiObjectId from "joi-objectid";

const Joi = JoiBase.extend(joiObjectId(JoiBase));
const gradePolicySchema = Joi.object({
  attribute: Joi.string()
    .valid("Exam", "Assignment", "Project", "Quiz", "Attendance")
    .required(),
  weight: Joi.number().min(0).max(100).required(),
  refModel: Joi.string()
    .valid("Exam", "Assignment", "Project")
    .when("attribute", {
      is: Joi.valid("Exam", "Assignment", "Project"),
      then: Joi.required(),
      otherwise: Joi.allow(null),
    }),
  refId: (Joi as any).objectId().when("attribute", {
    is: Joi.valid("Exam", "Assignment", "Project"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
});

const courseSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  image: Joi.string().uri().required(),
  description: Joi.string().required(),
  createdBy: (Joi as any).objectId().required(),
  assignedTeacher: (Joi as any).objectId().allow(null),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  GradePolicy: Joi.array()
    .items(gradePolicySchema)
    .custom((value: any[], helpers: CustomHelpers) => {
      const totalWeight = value.reduce((sum, gp) => sum + gp.weight, 0);
      if (totalWeight > 100) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "GradePolicy total weight validation"),
  departmentId: (Joi as any).objectId().required(),
  credits: Joi.number().min(1).required(),
});

export { gradePolicySchema, courseSchema };
