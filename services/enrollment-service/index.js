/**
 * @openapi
 * /enrollments/debug:
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
const express = require("express");
const os = require("os");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const app = express();
const PORT = process.env.PORT || 3003;

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Enrollment Service API",
    version: "1.0.0",
  },
};
const options = {
  swaggerDefinition,
  apis: ["./index.js", "./route/*.js"],
};
const swaggerSpec = swaggerJsdoc(options);

app.get("/", (req, res) => {
  res.send("Service is running!");
});

app.get("/debug", (req, res) => {
  res.send(`Handled by: ${os.hostname()}`);
});

app.post("/debug/send-event", async (req, res) => {
  try {
    const { sendMessage } = require("./producer/kafkaProducer");
    const { defaultTopic } = require("./config/kafkaConfig");
    const payload = req.body || {
      event: "enrollment.test",
      time: new Date().toISOString(),
    };
    await sendMessage(defaultTopic, payload);
    res.json({ ok: true, sent: payload });
  } catch (err) {
    console.error("Failed to send event", err);
    res.status(500).json({ ok: false, error: err && err.message });
  }
});

app.use("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
const enrollRouter = require("./route/enrollment.router");
app.use("/enrollments", enrollRouter);

app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`);
});
