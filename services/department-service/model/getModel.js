const { DepartmentSchema } = require("./department.model");
const { getTenantModel } = require("../config/tenantModelManager");

const schemaMap = {
  Department: DepartmentSchema,
};

function getModel(tenantId, modelName) {
  const schema = schemaMap[modelName];
  if (!schema) throw new Error(`Unknown model ${modelName}`);
  return getTenantModel(tenantId, modelName, schema);
}

module.exports = { getModel };
