import "dotenv/config";
import express, { Request, Response } from "express";
import os from "os";
import Keycloak from "keycloak-connect";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import router from "./routes/course.router";
import courseModuleRouter from "./routes/courseModule.router";
import { extractTenantId } from "./middleware/tenant.middleware";
import cors from "cors";
import { checkJwt, requireRole } from "./middleware/jwksAuth";

const app = express();
app.use(cors());
const memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: "some secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

const keycloak = new Keycloak({ store: memoryStore }, {
  realm: process.env.KEYCLOAK_REALM || "master",
  "auth-server-url": process.env.KEYCLOAK_URL || "http://localhost:8080/",
  resource: process.env.AUDIENCE || "course-service",
  credentials: {
    secret: process.env.USER_CLIENT_SECRET,
  },
  "confidential-port": 0,
} as any);
app.use(keycloak.middleware());
const PORT = process.env.PORT || 3001;

// Start server immediately; DB connections are handled per-tenant
app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`);
});

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Course Service API",
    version: "1.0.0",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ["./index.ts", "./routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

app.use("/swagger.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
/**
 * @openapi
 * /debug:
 *   get:
 *     summary: Debug endpoint
 *     responses:
 *       200:
 *         description: Returns the hostname handling the request
 */
app.get("/debug", (_req: Request, res: Response) => {
  res.send(`Handled by: ${os.hostname()}`);
});
app.post("/debug/send-event", async (req: Request, res: Response) => {
  try {
    const { sendMessage } = require("./producer/kafkaProducer");
    const { defaultTopic } = require("./config/kafkaConfig");
    const payload = (req as any).body || {
      event: "course.test",
      time: new Date().toISOString(),
    };
    await sendMessage(defaultTopic, payload);
    res.json({ ok: true, sent: payload });
  } catch (err: any) {
    console.error("Failed to send event", err);
    res.status(500).json({ ok: false, error: err && err.message });
  }
});
app.use("/coursemodule", extractTenantId, courseModuleRouter);
app.use("/", checkJwt, requireRole("student"), router);
