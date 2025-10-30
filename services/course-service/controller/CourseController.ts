import { Request, Response, NextFunction } from "express";
import { getModel } from "../model/getModel";

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;

    const Course = getModel<any & import("mongoose").Document>(
      tenantId,
      "Course"
    );
    const course = new Course(req.body);
    await course.save();
    // publish course.created (best-effort)
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        // Normalize courseId to string in a safe way (covers ObjectId or string)
        const courseId =
          course._id && typeof (course._id as any).toString === "function"
            ? (course._id as any).toString()
            : String(course._id);
        const event = {
          event: "course.created",
          tenantId: tenantId || "default",
          courseId,
          title: (course as any).title,
        };
        await sendMessage(defaultTopic, event);
      } catch (err: any) {
        console.error("Failed to publish course.created", err && err.message);
      }
    })();
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInactiveCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const courses = await Course.find({ status: false });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const scheduleCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s >= e)
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const course = await Course.findByIdAndUpdate(
      req.params.courseid,
      { startDate: s, endDate: e },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const CourseModule = getModel(tenantId, "CourseModule");
    const EnrolledCourse = getModel(tenantId, "EnrolledCourse");
    const course = await Course.findById(req.params.courseid);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const courseModules = await CourseModule.find({ course: course._id });
    const enrolledStudents = await EnrolledCourse.find({
      course: course._id,
    }).populate("user");
    res.status(200).json({ result: course, courseModules, enrolledStudents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartmentMine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // expects req.user to contain department info (middleware responsibility)
    const tenantId = (req as any).tenantId;
    const user = (req as any).user || {};
    const deptId = user.department || req.query.department;
    if (!deptId)
      return res.status(400).json({ error: "department not provided" });
    const Course = getModel(tenantId, "Course");
    const courses = await Course.find({ department: deptId });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartmentOverviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const EnrolledCourse = getModel(tenantId, "EnrolledCourse");
    const Exam = getModel(tenantId, "Exam");
    const deptId = (req as any).user?.department || req.query.department;
    if (!deptId)
      return res.status(400).json({ error: "department not provided" });
    const coursesCount = await Course.countDocuments({ department: deptId });
    const enrollmentsCount = await EnrolledCourse.countDocuments({});
    const examsCount = await Exam.countDocuments({});
    // upcoming: simple heuristic - exams with startDate in future
    const upcoming = await Exam.find({ startDate: { $gt: new Date() } }).limit(
      10
    );
    res
      .status(200)
      .json({ coursesCount, enrollmentsCount, examsCount, upcoming });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeacherCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const user = (req as any).user || {};
    const Course = getModel(tenantId, "Course");
    // return courses createdBy or assignedTeacher equal to current teacher
    const teacherId = user.sub || user.user_id || user._id;
    const courses = await Course.find({
      $or: [{ createdBy: teacherId }, { assignedTeacher: teacherId }],
    });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const registrarCreateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Similar to createCourse but kept for Registrar-specific behavior (file upload not implemented here)
  return createCourse(req, res, next);
};

export const assignTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Course = getModel(tenantId, "Course");
    const { courseid, teacherid } = req.params;
    const course = await Course.findByIdAndUpdate(
      courseid,
      { assignedTeacher: teacherid },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
