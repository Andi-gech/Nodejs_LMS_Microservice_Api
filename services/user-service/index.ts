/**
 * @openapi
 * /users/debug:
 *   get:
 *     summary: Debug endpoint
 *     responses:
 *       200:
 *         description: Returns the hostname handling the request
 */
/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint
 *     responses:
 *       200:
 *         description: Service is running!
 */

import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import os from "os";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { tenantMiddleware } from "./config/tenantMiddleware";
import router from "./route/user.router";
import { sendMessage } from "./producer/kafkaProducer";
import { startConsumer } from "./consumer/kafkaConsumer";
import { defaultUserTopic } from "./config/kafkaConfig";

import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3006;

// Parse incoming JSON and URL-encoded payloads so handlers can read req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Producer/consumer are implemented in separate modules.

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "User Service API",
    version: "1.0.0",
  },
  components: {
    parameters: {
      TenantIdHeader: {
        name: "x-tenant-id",
        in: "header",
        required: true,
        description: "Tenant ID for multi-tenant DB routing",
        schema: {
          type: "string",
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./index.ts", "./route/*.ts", "./controller/*.ts", "./models/*.ts"],
};
const swaggerSpec = swaggerJsdoc(options);

app.use("/swagger.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/debug", (req: Request, res: Response) => {
  res.send(`Handled by: ${os.hostname()}`);
});
// Debug: return decoded token payload (requires the JWT middleware on the route that calls it)
app.get("/debug/me", (req: Request, res: Response) => {
  res.json({ user: (req as any).user || null });
});
// Debug route to send a sample user event to Kafka
app.post("/debug/send-user-event", async (req: Request, res: Response) => {
  const payload = req.body || { userId: 1, action: "created" };
  try {
    await sendMessage(defaultUserTopic, payload);
    return res.status(200).json({ ok: true, sent: payload });
  } catch (err: any) {
    console.error("Failed to send user event:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
// Mount the user routes under /users to match the project API structure
app.use("/", tenantMiddleware, router);

// Start background consumer (non-blocking). If Kafka is unavailable we'll log and continue.
(async function initBackground() {
  try {
    await startConsumer(defaultUserTopic);
    console.log(process.env.KEYCLOAK_REALM, "ss");
    console.log(
      "Keycloak Admin Client ID:",
      process.env.KEYCLOAK_ADMIN_CLIENT_ID
    );
    console.log(
      "Keycloak Admin Client Secret:",
      process.env.KEYCLOAK_ADMIN_CLIENT_SECRET
    );
    console.log("Keycloak URL:", process.env.KEYCLOAK_URL);
    console.log("Keyclock ", process.env.KEYCLOAK_USER_CLIENT_ID);
    console.log("Kafka consumer started for topic", defaultUserTopic);
  } catch (err: any) {
    console.warn(
      "Kafka consumer failed to start (will continue):",
      err.message || err
    );
  }
})();

app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`);
});
