import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/shared/types/context";
import { logger } from "@/shared/utils/logger";
import { HTTP_INTERNAL_SERVER_ERROR } from "@/shared/constants/http-status";

interface ValidationError {
  path: string;
  message: string;
}

interface ErrorCauseWithCode {
  code?: unknown;
}

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  logger.error(err.message, { error: err.stack });

  if (err instanceof HTTPException) {
    const rawCause = err.cause as unknown;

    let validationErrors: ValidationError[] | undefined;
    let errorCode: string | undefined;

    if (Array.isArray(rawCause)) {
      validationErrors = rawCause as ValidationError[];
      logger.error(`Validation failed: ${err.message}`, {
        status: err.status,
        errors: validationErrors,
      });
    } else if (rawCause && typeof rawCause === "object") {
      const causeWithCode = rawCause as ErrorCauseWithCode;
      if (
        typeof causeWithCode.code === "string" &&
        causeWithCode.code.trim().length > 0
      ) {
        errorCode = causeWithCode.code;
      }
    }

    return c.json(
      {
        success: false,
        error: err.message,
        ...(errorCode && { code: errorCode }),
        ...(validationErrors && { errors: validationErrors }),
      },
      err.status,
    );
  }

  return c.json(
    {
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    },
    HTTP_INTERNAL_SERVER_ERROR,
  );
};
