const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const os = require("os");
const swaggerUi = require("swagger-ui-express");

const axios = require("axios");

const app = express();

app.use(
  "/courses",
  createProxyMiddleware({
    target: "http://course-service:3001",
    changeOrigin: true,
    pathRewrite: { "^/courses": "/api/courses" },
  })
);
app.use(
  "/departments",
  createProxyMiddleware({
    target: "http://department-service:3002",
    changeOrigin: true,
    pathRewrite: { "^/departments": "/api/departments" },
  })
);
app.use(
  "/enrollments",
  createProxyMiddleware({
    target: "http://enrollment-service:3003",
    changeOrigin: true,
    pathRewrite: { "^/enrollments": "/api/enrollments" },
  })
);
app.use(
  "/exams",
  createProxyMiddleware({
    target: "http://exam-service:3004",
    changeOrigin: true,
    pathRewrite: { "^/exams": "/api/exams" },
  })
);
app.use(
  "/notifications",
  createProxyMiddleware({
    target: "http://notification-service:3005",
    changeOrigin: true,
    pathRewrite: { "^/notifications": "/api/notifications" },
  })
);
app.use(
  "/users",
  createProxyMiddleware({
    target: "http://user-service:3006",
    changeOrigin: true,
    pathRewrite: { "^/users": "/api/users" },
  })
);
app.use(
  "/tenants",
  createProxyMiddleware({
    target: "http://tenant-service:3010",
    changeOrigin: true,
    pathRewrite: { "^/tenants": "/api/tenants" },
  })
);

app.get("/", (req, res) => {
  res.send("API Gateway is running!");
});

app.get("/debug", (req, res) => {
  res.send(` api Handled by: ${os.hostname()}`);
});
app.get("/health", (req, res) => {
  res.send("OK");
});

const serviceSpecs = [
  { name: "API Gateway ", url: "http://localhost/api-docs/swagger.json" },
  { name: "Course Service", url: "http://localhost/courses/swagger.json" },
  {
    name: "Department Service",
    url: "http://localhost/departments/swagger.json",
  },
  {
    name: "Enrollment Service",
    url: "http://localhost/enrollments/swagger.json",
  },
  { name: "Exam Service", url: "http://localhost/exams/swagger.json" },
  {
    name: "Notification Service",
    url: "http://localhost/notifications/swagger.json",
  },
  { name: "User Service", url: "http://localhost/users/swagger.json" },
  { name: "Tenant Service", url: "http://localhost/tenants/swagger.json" },
];

async function retryGet(url, attempts = 4, baseDelay = 300) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.get(url, { timeout: 3000 });
    } catch (err) {
      const isLast = i === attempts - 1;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Failed to fetch ${url} (attempt ${i + 1}/${attempts})`);
      if (isLast) throw err;

      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function getCombinedSpec() {
  console.log("Fetching Swagger specs from services...");
  const specs = await Promise.all(
    serviceSpecs.map(async (svc) => {
      try {
        const res = await retryGet(svc.url, 5, 200);
        console.log(`Fetched Swagger spec from ${svc.name}`);
        return res.data;
      } catch (e) {
        console.warn(
          `Could not fetch swagger from ${svc.name} at ${svc.url}: ${e.message}`
        );
        return null;
      }
    })
  );

  const base = {
    openapi: "3.0.0",
    info: { title: "API Gateway", version: "1.0.0" },
    paths: {},
    components: {},
  };
  for (const spec of specs) {
    if (spec && spec.paths) Object.assign(base.paths, spec.paths);
    if (spec && spec.components)
      Object.assign(base.components, spec.components);
  }
  return base;
}

app.get("/api-docs/swagger.json", async (req, res) => {
  const spec = await getCombinedSpec();
  res.json(spec);
});
var options = {
  explorer: true,
  swaggerOptions: {
    urls: serviceSpecs,
  },
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, options));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
