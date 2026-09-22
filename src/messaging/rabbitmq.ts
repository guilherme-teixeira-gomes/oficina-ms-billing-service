import amqplib, { Channel } from "amqplib";

const EXCHANGE = "oficina.saga";

let connection: any = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<Channel> {
  if (channel) return channel;
  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  return channel;
}

export async function publishEvent(routingKey: string, payload: object): Promise<void> {
  const ch = await connectRabbitMQ();
  ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
  });
}

export async function subscribe(
  queue: string,
  routingKey: string,
  handler: (payload: any) => Promise<void>
): Promise<void> {
  const ch = await connectRabbitMQ();
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, EXCHANGE, routingKey);
  ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      ch.ack(msg);
    } catch (err) {
      console.error(JSON.stringify({ level: "error", message: "erro ao processar", queue, error: (err as Error).message }));
      ch.nack(msg, false, false);
    }
  });
}

export async function closeRabbitMQ(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}

export { EXCHANGE };
