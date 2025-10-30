import { Request, Response, NextFunction } from "express";
import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      db?: Connection;
    }
  }
}

const dbConnections: Record<string, Connection> = {};
const MONGO_URI = process.env.MONGO_URI; // e.g. "mongodb://localhost:27017/"

if (!MONGO_URI) throw new Error("MONGO_URI not defined in .env");

export const getTenantDb = async (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID required");

  if (!dbConnections[tenantId]) {
    dbConnections[tenantId] = await mongoose.createConnection(
      `${MONGO_URI}${tenantId}?retryWrites=true&w=majority`
    );
  }

  return dbConnections[tenantId];
};

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    req.db = await getTenantDb(tenantId);

    next();
  } catch (err: any) {
    res.status(500).send(err.message);
  }
};
