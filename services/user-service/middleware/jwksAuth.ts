import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const jwksUri = process.env.JWKS_URL;
if (!jwksUri)
  throw new Error(
    "JWKS_URL environment variable is required for JWKS auth middleware"
  );
const client = jwksClient({ jwksUri });

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err: any, key: any) => {
    if (err) return callback(err, null);
    const signingKey =
      key && key.getPublicKey
        ? key.getPublicKey()
        : key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export function checkJwt(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token provided");
  const verifyOptions: any = {
    issuer: process.env.JWT_ISSUER,
    algorithms: ["RS256"],
  };
  if (process.env.AUDIENCE) verifyOptions.audience = process.env.AUDIENCE;

  jwt.verify(token, getKey as any, verifyOptions, (err: any, decoded: any) => {
    if (err) return res.status(401).send("Invalid token");
    (req as any).user = decoded;
    next();
  });
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user || {};
    const roles = user.realm_access?.roles || [];
    if (roles.includes(role)) return next();
    return res.status(403).send("Forbidden");
  };
}
