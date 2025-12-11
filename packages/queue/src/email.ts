import { Queue, QueueEvents, Worker, type Processor, type WorkerOptions } from 'bullmq';
import Connection from './connection';
import type { JobPayloadMap, SendEmailPayload } from './types';

export const EMAIL_QUEUE_NAME = 'email';

const defaultJobOptions = {
	attempts: 5,
	backoff: { type: 'exponential', delay: 2000 },
	removeOnComplete: true,
	removeOnFail: false,
};

const defaultWorkerOptions: Omit<WorkerOptions, 'connection'> = {
	concurrency: 3,
	// add limiter if provider has strict rate limits
	// limiter: { max: 20, duration: 1000 },
};

export const getEmailQueue = () =>
	new Queue<SendEmailPayload>(EMAIL_QUEUE_NAME, {
		connection: Connection.getInstance().getConnection(),
		defaultJobOptions,
	});

export const getEmailWorker = (
	processor: Processor<JobPayloadMap['send-email']>,
	options?: Partial<WorkerOptions>
) =>
	new Worker<JobPayloadMap['send-email']>(EMAIL_QUEUE_NAME, processor, {
		...defaultWorkerOptions,
		...options,
		connection: Connection.getInstance().getConnection(),
		autorun: true,
	});

export const getEmailQueueEvents = () =>
	new QueueEvents(EMAIL_QUEUE_NAME, {
		connection: Connection.getInstance().getConnection(),
	});
