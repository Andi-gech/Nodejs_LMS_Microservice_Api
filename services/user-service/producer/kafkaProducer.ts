import { Kafka, Producer } from "kafkajs";
import { kafkaBrokers, kafkaClientId } from "../config/kafkaConfig";

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (producer) return producer;
  const kafka = new Kafka({ clientId: kafkaClientId, brokers: kafkaBrokers });
  producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function sendMessage(
  topic: string,
  message: object
): Promise<void> {
  const p = await getProducer();
  await p.send({ topic, messages: [{ value: JSON.stringify(message) }] });
}

export async function disconnectProducer(): Promise<void> {
  if (!producer) return;
  try {
    await producer.disconnect();
  } finally {
    producer = null;
  }
}
