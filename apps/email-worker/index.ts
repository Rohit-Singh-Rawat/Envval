import { getEmailQueueEvents, getEmailWorker } from "@envval/queue/email";
import { sendEmail, type SendEmailPayload } from "@envval/email";
import { logger } from "./logger";

const worker = getEmailWorker(
  async (job) => {
    const jobId = job.id;
    const payload = job.data as SendEmailPayload;

    logger.info("Processing email job", {
      jobId,
      template: payload.template,
      to: payload.to,
      attemptsMade: job.attemptsMade,
    });

    try {
      const result = await sendEmail({
        ...payload,
        idempotencyKey: jobId as string,
      });

      logger.info("Email sent successfully", {
        jobId,
        template: payload.template,
        to: payload.to,
        provider: result.provider,
        emailId: result.id,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error("Failed to send email", {
        jobId,
        template: payload.template,
        to: payload.to,
        attemptsMade: job.attemptsMade,
        error: errorMessage,
        stack: errorStack,
        errorObject: error,
      });

      throw error;
    }
  },
  {
    concurrency: 3,
  },
);

const queueEvents = getEmailQueueEvents();

queueEvents.on("waiting", ({ jobId }) => {
  logger.debug("Email job waiting", { jobId });
});

queueEvents.on("active", ({ jobId }) => {
  logger.debug("Email job started", {
    jobId,
  });
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Email job completed", {
    jobId,
    returnvalue,
  });
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Email job failed", {
    jobId,
    error: failedReason,
    failedReason,
  });
});

queueEvents.on("stalled", ({ jobId }) => {
  logger.warn("Email job stalled", { jobId });
});

queueEvents.on("progress", ({ jobId, data }) => {
  logger.debug("Email job progress", {
    jobId,
    progress: data,
  });
});

worker.on("error", (error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error("Email worker error", {
    error: errorMessage,
    stack: errorStack,
    errorObject: error,
  });
});

worker.on("closed", () => {
  logger.warn("Email worker closed");
});

logger.info("Email worker started", {
  concurrency: 3,
  nodeEnv: process.env.NODE_ENV,
});
