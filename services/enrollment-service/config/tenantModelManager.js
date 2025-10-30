const mongoose = require("mongoose");

const connections = {};

function getTenantConnection(tenantId) {
  if (!connections[tenantId]) {
    const dbUri = process.env.MONGO_URI
      ? process.env.MONGO_URI.replace("<DB_NAME>", tenantId)
      : `mongodb://localhost:27017/${tenantId}`;
    connections[tenantId] = mongoose.createConnection(dbUri);
  }
  return connections[tenantId];
}

function getTenantModel(tenantId, modelName, schema) {
  const conn = getTenantConnection(tenantId);
  return conn.models[modelName] || conn.model(modelName, schema);
}

module.exports = { getTenantConnection, getTenantModel };
