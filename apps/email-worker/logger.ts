import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
mkdir(logsDir, { recursive: true }).catch(() => {
  // Ignore errors - winston will handle file creation
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (stack) {
      msg += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  }),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "email-worker" },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in non-production or if explicitly enabled
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_CONSOLE_LOGS === "true"
) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, "exceptions.log"),
  }),
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, "rejections.log"),
  }),
);
