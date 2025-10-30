/**
 * @openapi
 * /notifications/debug:
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
const app = express();
const PORT = process.env.PORT || 3005;
let lastUserEvent = null;

const { Kafka } = require("kafkajs");
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["kafka:9092"],
});
const consumer = kafka.consumer({ groupId: "notification-group" });
const os = require("os");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

app.get("/", (req, res) => {
  res.send("Service is running!");
});

app.get("/get", (req, res) => {
  if (lastUserEvent) {
    res.send(`Last user event: ${lastUserEvent}`);
  } else {
    res.send("No user events received yet.");
  }
});

app.get("/debug", (req, res) => {
  res.send(`Handled by: ${os.hostname()}`);
});

app.post("/debug/send-event", async (req, res) => {
  try {
    const { sendMessage } = require("./producer/kafkaProducer");
    const { defaultTopic } = require("./config/kafkaConfig");
    const payload = req.body || {
      event: "notification.test",
      time: new Date().toISOString(),
    };
    await sendMessage(defaultTopic, payload);
    res.json({ ok: true, sent: payload });
  } catch (err) {
    console.error("Failed to send event", err);
    res.status(500).json({ ok: false, error: err && err.message });
  }
});

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Notification Service API",
    version: "1.0.0",
  },
};
const options = {
  swaggerDefinition,
  apis: ["./index.js"],
};
const swaggerSpec = swaggerJsdoc(options);

app.use("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
// mount notifications router (tenant-aware)
const notifRouter = require("./route/notification.router");
app.use("/notifications", notifRouter);

async function listenForUserEvents() {
  await consumer.connect();
  await consumer.subscribe({ topic: "user-events", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      lastUserEvent = message.value.toString();
      console.log(`Received message: ${lastUserEvent}`);
    },
  });
}

listenForUserEvents();

app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`);
});
