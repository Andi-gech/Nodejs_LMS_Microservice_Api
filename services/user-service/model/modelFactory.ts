// helpers/modelFactory.ts
import { Connection, Model } from "mongoose";

export function getModel<T = any>(
  db: Connection,
  name: string,
  schema: any
): Model<T> {
  return db.models[name] || db.model<T>(name, schema);
}
