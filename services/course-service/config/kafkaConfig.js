const brokers = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",").map((s) => s.trim())
  : ["kafka:9092"];
const clientId = process.env.KAFKA_CLIENT_ID || "course-service";
const defaultTopic = process.env.KAFKA_COURSE_TOPIC || "course-events";

module.exports = { brokers, clientId, defaultTopic };
