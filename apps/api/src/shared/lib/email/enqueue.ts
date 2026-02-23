import { SendEmailPayload } from "@envval/queue/types";
import { getEmailQueue } from "@envval/queue/email";
import { validateSendEmailPayload } from "@envval/email/schema";
import { ensureIdempotencyKey } from "@envval/email";

export const enqueueEmail = async (payload: SendEmailPayload) => {
  const validated = validateSendEmailPayload(payload);

  const jobId = ensureIdempotencyKey(validated);
  const queue = getEmailQueue();

  // Queue will automatically retry 2 times (3 total attempts)
  // If all attempts fail, job will be removed
  const job = await queue.add("send-email", payload, {
    jobId,
    attempts: 3, // 1 initial + 2 retries
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  });

  return {
    jobId: job.id,
    name: job.name,
    data: job.data,
  };
};
