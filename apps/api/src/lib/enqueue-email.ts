import { SendEmailPayload } from '@envval/queue/types';
import { getEmailQueue } from '@envval/queue/email';
import { validateSendEmailPayload } from '@envval/email/schema';
import { ensureIdempotencyKey } from '@envval/email';

export const enqueueEmail = async (payload: SendEmailPayload) => {
	const validated = validateSendEmailPayload(payload);

	const jobId = ensureIdempotencyKey(validated);
	const queue = getEmailQueue();

	const job = await queue.add('send-email', payload, {
		jobId,
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 1000,
		},
		removeOnComplete: true,
		removeOnFail: false,
	});

	return {
		jobId: job.id,
		name: job.name,
		data: job.data,
	};
};
