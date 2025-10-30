import { Request, Response } from "express";
import { getModel } from "../model/getModel";

function getCourseModuleModel(req: Request) {
  const tenantId = (req as any).tenantId || "default";
  return getModel(tenantId, "CourseModule") as any;
}

export const createCourseModule = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    req.body.course = req.params.courseid;
    const video = (req as any).file as any;
    if (video) req.body.videolink = `uploads/catagory/${video.filename}`;

    let desired = Number(req.body.order);
    if (Number.isNaN(desired)) desired = 1;
    const conflict = await CourseModule.findOne({
      order: desired,
      course: req.params.courseid,
    });
    if (conflict) {
      await CourseModule.updateMany(
        { course: req.params.courseid, order: { $gte: desired } },
        { $inc: { order: 1 } }
      );
    }
    req.body.order = desired;
    const result = await CourseModule.create(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("createCourseModule error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteCourseModule = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const isvalid = require("mongoose").isValidObjectId(req.params.id);
    if (!isvalid) return res.status(400).send("invalid id");
    const result = await CourseModule.findByIdAndDelete(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error("deleteCourseModule error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateCourseModule = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const isvalid = require("mongoose").isValidObjectId(req.params.id);
    if (!isvalid) return res.status(400).send("invalid id");

    const module: any = await CourseModule.findById(req.params.id);
    if (!module) return res.status(404).send("Module not found");

    const { name, content, order } = req.body;
    if (name !== undefined) module.name = name;
    if (content !== undefined) module.content = content;
    if (order !== undefined) {
      const newOrder = Number(order);
      if (Number.isNaN(newOrder)) return res.status(400).send("Invalid order");
      if (module.order !== newOrder) {
        const conflicting: any = await CourseModule.findOne({
          course: req.params.courseid,
          order: newOrder,
          _id: { $ne: module._id },
        });
        if (conflicting) {
          const oldOrder = module.order;
          conflicting.order = oldOrder;
          await conflicting.save();
        }
        module.order = newOrder;
      }
    }
    if ((req as any).file)
      module.videolink = `uploads/catagory/${(req as any).file.filename}`;
    await module.save();
    res.json(module);
  } catch (error: any) {
    console.error("updateCourseModule error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const listApprovals = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const status = (req.query.status as string) || "pending";
    const course = req.query.course as string | undefined;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (course) filter.course = course;
    const mods = await CourseModule.find(filter).sort({ order: 1 }).lean();
    res.json(mods);
  } catch (error: any) {
    console.error("listApprovals error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listByCourse = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const isvalid = require("mongoose").isValidObjectId(req.params.courseid);
    if (!isvalid) return res.status(400).send("Invalid id");
    const modules = await CourseModule.find({ course: req.params.courseid })
      .sort({ order: 1 })
      .lean();
    res.json(modules);
  } catch (error: any) {
    console.error("listByCourse error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getModuleById = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const isvalid = require("mongoose").isValidObjectId(req.params.moduleid);
    if (!isvalid) return res.status(400).send("Invalid id");
    const module = await CourseModule.findById(req.params.moduleid).lean();
    if (!module) return res.status(404).send("Module not found");
    res.json(module);
  } catch (error: any) {
    console.error("getModuleById error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const approveModule = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const { id } = req.params;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const mod: any = await CourseModule.findById(id);
    if (!mod) return res.status(404).send("Module not found");
    mod.status = "approved";
    await mod.save();
    res.json({ _id: mod._id, status: mod.status });
  } catch (error: any) {
    console.error("approveModule error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const rejectModule = async (req: Request, res: Response) => {
  try {
    const CourseModule: any = getCourseModuleModel(req);
    const { id } = req.params;
    if (!require("mongoose").isValidObjectId(id))
      return res.status(400).send("Invalid id");
    const mod: any = await CourseModule.findById(id);
    if (!mod) return res.status(404).send("Module not found");
    mod.status = "rejected";
    await mod.save();
    res.json({ _id: mod._id, status: mod.status });
  } catch (error: any) {
    console.error("rejectModule error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
