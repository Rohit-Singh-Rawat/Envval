import type { TemplateDataMap } from '@envval/email';

type QueueName = 'email';

interface SendEmailPayload<T extends keyof TemplateDataMap = keyof TemplateDataMap> {
	to: string | string[];
	from: string;
	replyTo?: string;
	template: T;
	data: TemplateDataMap[T];
	idempotencyKey?: string;
}

type JobPayloadMap = {
	'send-email': SendEmailPayload;
};

type QueueJobMap = {
	email: 'send-email';
};

type JobName = JobPayloadMap extends Record<infer K, unknown> ? K : never;

type JobsForQueue<Q extends QueueName> = QueueJobMap[Q];

type JobPayload<Q extends QueueName, J extends JobsForQueue<Q>> = J extends keyof JobPayloadMap
	? JobPayloadMap[J]
	: never;

export type {
	QueueName,
	JobName,
	JobPayload,
	JobPayloadMap,
	QueueJobMap,
	JobsForQueue,
	SendEmailPayload,
};
