import { getEmailQueueEvents, getEmailWorker } from '@envval/queue/email';
import { sendEmail, type SendEmailPayload } from '@envval/email';

const worker = getEmailWorker(
	async (job) => {
		const payload = job.data as SendEmailPayload;
		await sendEmail({ ...payload, idempotencyKey: job.id as string });
	},
	{
		concurrency: 3,
	}
);

const queueEvents = getEmailQueueEvents();

queueEvents.on('completed', (job) => {
	console.log(`email job ${job?.jobId} completed`);
});

queueEvents.on('failed', (job, error) => {
	const message =
		error && typeof error === 'object' && 'message' in error
			? String((error as any).message)
			: String(error);
	console.error(`email job ${job?.jobId} failed: ${message}`);
});

worker.on('error', (error) => {
	console.error('email worker error', error);
});
