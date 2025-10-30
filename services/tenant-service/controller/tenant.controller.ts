import { Request, Response, NextFunction } from "express";
import { TenantModel } from "../model/tenant.model";

export const createTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = new TenantModel(req.body);
    await tenant.save();
    // publish tenant.created event (best-effort) so other services can provision tenant DBs
    (async () => {
      try {
        const { sendMessage } = require("../producer/kafkaProducer");
        const { defaultTopic } = require("../config/kafkaConfig");
        const event = {
          event: "tenant.created",
          tenantId: tenant._id.toString(),
          name: tenant.name,
        };
        await sendMessage(defaultTopic, event);
      } catch (err: any) {
        console.error(
          "Failed to publish tenant.created",
          err && (err as any).message
        );
      }
    })();
    res.status(201).json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getTenants = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenants = await TenantModel.find();
    res.status(200).json(tenants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTenantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = await TenantModel.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = await TenantModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = await TenantModel.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json({ message: "Tenant deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
