import mongoose, { Connection, Schema, Document, Model } from "mongoose";

const connections: Record<string, Connection> = {};

export function getTenantConnection(tenantId: string): Connection {
  if (!connections[tenantId]) {
    const dbUri = process.env.MONGO_URI
      ? process.env.MONGO_URI.replace("<DB_NAME>", tenantId)
      : `mongodb://localhost:27017/${tenantId}`;
    connections[tenantId] = mongoose.createConnection(dbUri);
  }
  return connections[tenantId];
}

export function getTenantModel<T extends Document>(
  tenantId: string,
  modelName: string,
  schema: Schema<T>
): Model<T> {
  const conn = getTenantConnection(tenantId);
  return conn.models[modelName] || conn.model<T>(modelName, schema);
}
