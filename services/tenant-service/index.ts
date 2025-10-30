import "dotenv/config";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import os from "os";
import mongoose from "mongoose";
import tenantRouter from "./route/tenant.router";

const app = express();
const PORT = process.env.PORT || 3010;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tenant Service API",
      version: "1.0.0",
      description: "API documentation for the Tenant Service",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./route/*.ts", "./controller/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const mongoUri: string =
  process.env.MONGO_URI || "mongodb://mongo:27017/tenant-service";

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Expose the raw swagger.json so the API Gateway can fetch and merge it
app.use("/swagger.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/", tenantRouter);

app.get("/debug", (_req: Request, res: Response) => {
  res.send(`Handled by: ${os.hostname()}`);
});

app.post("/debug/send-event", async (req: Request, res: Response) => {
  try {
    const { sendMessage } = require("./producer/kafkaProducer");
    const { defaultTopic } = require("./config/kafkaConfig");
    const payload = req.body || {
      event: "tenant.test",
      time: new Date().toISOString(),
    };
    await sendMessage(defaultTopic, payload);
    res.json({ ok: true, sent: payload });
  } catch (err: any) {
    console.error("Failed to send event", err);
    res.status(500).json({ ok: false, error: err && err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Tenant service listening on port ${PORT}`);
});
