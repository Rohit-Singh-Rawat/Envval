import { Redis } from 'ioredis';

const getQueueRedisUrl = (): string => {
	const url =
		process.env.QUEUE_REDIS_URL ?? process.env.BULLMQ_REDIS_URL ?? process.env.REDIS_URL ?? '';

	if (!url) {
		throw new Error(
			'QUEUE_REDIS_URL (or BULLMQ_REDIS_URL/REDIS_URL) is required for BullMQ connection'
		);
	}

	return url;
};

class Connection {
	private static instance: Connection | null = null;
	private connection: Redis;

	private constructor(redisUrl: string) {
		this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
	}

	static getInstance(): Connection {
		if (!Connection.instance) {
			Connection.instance = new Connection(getQueueRedisUrl());
		}
		return Connection.instance;
	}

	getConnection() {
		return this.connection;
	}
}

export default Connection;
