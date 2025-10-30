import { Kafka, Consumer } from "kafkajs";
import { kafkaBrokers, kafkaClientId } from "../config/kafkaConfig";

let consumer: Consumer | null = null;

export async function startConsumer(
  topic: string,
  groupId = "user-service-group"
) {
  if (consumer) return consumer;
  const kafka = new Kafka({ clientId: kafkaClientId, brokers: kafkaBrokers });
  consumer = kafka.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString() || "";
        console.log(
          `Consumed message on ${topic} partition ${partition}: ${value}`
        );
        // TODO: add processing logic here (emit events to internal handlers)
      } catch (err) {
        console.error("Error processing message:", err);
      }
    },
  });
  return consumer;
}

export async function stopConsumer(): Promise<void> {
  if (!consumer) return;
  try {
    await consumer.disconnect();
  } finally {
    consumer = null;
  }
}
