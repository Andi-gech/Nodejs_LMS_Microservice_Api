import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //     return res.status(401).json({ message: "Unauthorized" });
  //   }

  //   const token = authHeader.split(" ")[1];
  try {
    // const secret = process.env.JWT_SECRET || "your_jwt_secret";
    // const decoded = jwt.verify(token, secret);

    // (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
