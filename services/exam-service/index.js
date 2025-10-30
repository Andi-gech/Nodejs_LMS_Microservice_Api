/**
 * @openapi
 * /exams/debug:
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
const PORT = process.env.PORT || 3004;

// Ensure upload directories exist
const fs = require("fs");
const path = require("path");
const uploadsDir = path.join(__dirname, "public", "uploads", "assignments");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn("Could not ensure uploads directory:", e && e.message);
}

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Exam Service API",
    version: "1.0.0",
  },
};
const options = {
  swaggerDefinition,
  apis: ["./index.js", "./model/*.js", "./route/*.js"],
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
      event: "exam.test",
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
// mount routers
// Mount all exam-related routers under a unified /exam base so runtime paths
// match the OpenAPI JSDoc we expose in each router (e.g. /exam/questions).
app.use("/exam", require("./route/exam.router"));
app.use("/exam/questions", require("./route/question.router"));
app.use("/exam/answers", require("./route/answer.router"));
app.use("/exam/submissions", require("./route/submission.router"));
app.use("/exam/results", require("./route/result.router"));
// assignments (assignment creation, submissions, grading)
app.use("/exam/assignments", require("./route/assignment.router"));

app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`);
});
