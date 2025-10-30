function extractTenantId(req, res, next) {
  // For now set a default tenantId; adjust to read from header/JWT as needed
  req.tenantId = req.headers["x-tenant-id"] || "default";
  next();
}

module.exports = { extractTenantId };
