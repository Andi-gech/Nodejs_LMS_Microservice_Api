function extractTenantId(req, res, next) {
  req.tenantId = req.headers["x-tenant-id"] || "default";
  next();
}

module.exports = { extractTenantId };
