import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const jwksUri = process.env.JWKS_URL;
if (!jwksUri) throw new Error("JWKS_URL environment variable is required");

const client = jwksClient({ jwksUri });

async function getKeyAsync(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      if (!key) return reject(new Error("No signing key found"));
      resolve(key.getPublicKey());
    });
  });
}

export async function checkJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    const decodedHeader: any = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header)
      return res.status(401).send("Invalid token header");

    const key = await getKeyAsync(decodedHeader.header.kid);

    const verifyOptions: jwt.VerifyOptions = {
      issuer: process.env.JWT_ISSUER,
      algorithms: ["RS256"],
    };

    const decoded = jwt.verify(token, key, verifyOptions) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error("JWT verification failed:", err.message);
    res.status(401).send("Invalid token");
  }
}

export function requireRole(requiredRoles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user || {};
    const roles: string[] = user.realm_access?.roles || [];

    const rolesToCheck = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    const hasRole = rolesToCheck.some((r) => roles.includes(r));

    if (hasRole) return next();
    return res.status(403).send("Forbidden");
  };
}
