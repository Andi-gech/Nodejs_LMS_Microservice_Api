const { EnrolledCourseSchema } = require("./enrolledCourse.model");
const { getTenantModel } = require("../config/tenantModelManager");

const schemaMap = {
  EnrolledCourse: EnrolledCourseSchema,
};

function getModel(tenantId, modelName) {
  const schema = schemaMap[modelName];
  if (!schema) throw new Error(`Unknown model ${modelName}`);
  return getTenantModel(tenantId, modelName, schema);
}

module.exports = { getModel };
