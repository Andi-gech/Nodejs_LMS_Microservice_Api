const brokers = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",").map((s) => s.trim())
  : ["kafka:9092"];
const clientId = process.env.KAFKA_CLIENT_ID || "enrollment-service";
const defaultTopic = process.env.KAFKA_ENROLLMENT_TOPIC || "enrollment-events";

module.exports = { brokers, clientId, defaultTopic };
