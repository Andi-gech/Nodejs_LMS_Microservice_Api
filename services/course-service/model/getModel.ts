import { Document, Model } from "mongoose";
import { getTenantConnection } from "../config/tenantModelManager";
import { CourseSchema } from "./course/course.schema";
import { CourseModuleSchema } from "./course/courseModule.schema";
// Add more schemas as needed

const schemaMap: Record<string, any> = {
  Course: CourseSchema,
  CourseModule: CourseModuleSchema,
  // Add other models here, e.g. User: UserSchema
};

export function getModel<T extends Document>(
  tenantId: string,
  modelName: string
): Model<T> {
  const conn = getTenantConnection(tenantId);
  const schema = schemaMap[modelName];
  if (!schema) throw new Error(`Schema for model '${modelName}' not found.`);
  return conn.models[modelName] || conn.model<T>(modelName, schema);
}
