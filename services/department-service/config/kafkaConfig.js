const brokers = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",").map((s) => s.trim())
  : ["kafka:9092"];
const clientId = process.env.KAFKA_CLIENT_ID || "department-service";
const defaultTopic = process.env.KAFKA_DEPARTMENT_TOPIC || "department-events";

module.exports = { brokers, clientId, defaultTopic };
