const { Kafka } = require("kafkajs");
const { brokers, clientId } = require("../config/kafkaConfig");

let producer = null;

async function getProducer() {
  if (producer) return producer;
  const kafka = new Kafka({ clientId, brokers });
  producer = kafka.producer();
  await producer.connect();
  return producer;
}

async function sendMessage(topic, payload) {
  try {
    const p = await getProducer();
    await p.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
  } catch (err) {
    console.error("Failed to send kafka message", err);
  }
}

module.exports = { getProducer, sendMessage };
