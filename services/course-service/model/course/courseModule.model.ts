import { Connection } from "mongoose";
import { CourseModuleSchema } from "./courseModule.schema";

export const getCourseModuleModel = (conn: Connection) => {
  return conn.model("CourseModule", CourseModuleSchema);
};
