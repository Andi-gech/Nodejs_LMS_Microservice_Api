const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const jwksUri = process.env.JWKS_URL;
if (!jwksUri) {
  console.warn("JWKS_URL not set; check environment if auth is required");
}

const client = jwksClient({ jwksUri });

function getKeyAsync(kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      if (!key) return reject(new Error("No signing key found"));
      resolve(key.getPublicKey());
    });
  });
}

async function checkJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header)
      return res.status(401).send("Invalid token header");

    const key = await getKeyAsync(decodedHeader.header.kid);
    const verifyOptions = {
      issuer: process.env.JWT_ISSUER,
      algorithms: ["RS256"],
    };
    const decoded = jwt.verify(token, key, verifyOptions);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err && err.message);
    res.status(401).send("Invalid token");
  }
}

function requireRole(requiredRoles) {
  return (req, res, next) => {
    const user = req.user || {};
    const roles = (user.realm_access && user.realm_access.roles) || [];
    const check = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    if (check.some((r) => roles.includes(r))) return next();
    return res.status(403).send("Forbidden");
  };
}

module.exports = { checkJwt, requireRole };
