import { Request, Response } from "express";
import { getModel } from "../model/getModel";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const a = await Assignment.create({
      ...req.body,
      createdBy: (req as any).user?.sub || (req as any).user?._id,
    });
    res.status(201).json(a);
  } catch (err: any) {
    console.error("createAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listAssignments = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const filter: any = {};
    if (req.query.course) filter.course = req.query.course;
    const items = await Assignment.find(filter).lean();
    res.json(items);
  } catch (err: any) {
    console.error("listAssignments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listMyAssignments = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const userId = (req as any).user?.sub || (req as any).user?._id;
    const items = await Assignment.find({ createdBy: userId }).lean();
    res.json(items);
  } catch (err: any) {
    console.error("listMyAssignments", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).send("Not found");
    res.json(updated);
  } catch (err: any) {
    console.error("updateAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const del = await Assignment.findByIdAndDelete(req.params.id);
    res.json({ ok: true, deleted: del });
  } catch (err: any) {
    console.error("deleteAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const item = await Assignment.findById(req.params.id).lean();
    if (!item) return res.status(404).send("Not found");
    res.json(item);
  } catch (err: any) {
    console.error("getAssignmentById", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listAssignmentSubmissions = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const subs = await Submission.find({ assignment: req.params.id }).lean();
    res.json(subs);
  } catch (err: any) {
    console.error("listAssignmentSubmissions", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listByCourse = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Assignment = getModel(tenantId, "Assignment");
    const items = await Assignment.find({ course: req.params.courseId }).lean();
    res.json(items);
  } catch (err: any) {
    console.error("listByCourse", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const file = (req as any).file;
    const payload: any = {
      assignment: req.params.id,
      student: (req as any).user?.sub || (req as any).user?._id,
      notes: req.body.notes || "",
      filePath: file ? `uploads/assignments/${file.filename}` : undefined,
      submittedAt: new Date(),
    };
    const s = await Submission.create(payload);
    res.status(201).json(s);
  } catch (err: any) {
    console.error("submitAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const gradeAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const Submission = getModel(tenantId, "AssignmentSubmission");
    const { grade } = req.body;
    const studentId = req.params.studentId;
    const sub = await Submission.findOneAndUpdate(
      { assignment: req.params.id, student: studentId },
      {
        grade,
        gradedAt: new Date(),
        gradedBy: (req as any).user?.sub || (req as any).user?._id,
      },
      { new: true }
    );
    if (!sub) return res.status(404).send("Submission not found");
    res.json(sub);
  } catch (err: any) {
    console.error("gradeAssignment", err && err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
