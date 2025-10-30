import { Connection } from "mongoose";
import { CourseSchema } from "./course.schema";
import { CourseDocument } from "./course.types";

export const getCourseModel = (conn: Connection) => {
  return conn.model<CourseDocument>("Course", CourseSchema);
};
