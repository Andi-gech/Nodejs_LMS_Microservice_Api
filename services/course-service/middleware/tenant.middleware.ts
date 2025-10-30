import { Request, Response, NextFunction } from "express";

export function extractTenantId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //   // Example: get tenantId from header. Adjust as needed (JWT, subdomain, etc.)
  //   const tenantId = req.headers["x-tenant-id"] as string;
  //   if (!tenantId) {
  //     return res.status(400).json({ error: "Missing tenant id" });
  //   }
  (req as any).tenantId = "68e03d3906ac2cf40ce3485f";
  next();
}
