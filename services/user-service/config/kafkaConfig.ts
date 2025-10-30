// Lightweight Kafka configuration helper
export const kafkaBrokers: string[] = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",").map((s) => s.trim())
  : ["kafka:9092"];

export const kafkaClientId = process.env.KAFKA_CLIENT_ID || "user-service";

export const defaultUserTopic = process.env.KAFKA_USER_TOPIC || "user-events";
