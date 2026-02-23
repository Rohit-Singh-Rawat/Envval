export type NormalizedClientErrorKind =
	| "rate_limit"
	| "validation"
	| "auth"
	| "network"
	| "unknown";

export interface NormalizedClientError {
	readonly message: string;
	readonly code?: string;
	readonly status?: number;
	readonly kind: NormalizedClientErrorKind;
}

interface ErrorLikeShape {
	readonly message?: unknown;
	readonly error?: unknown;
	readonly error_description?: unknown;
	readonly status?: unknown;
	readonly code?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isErrorLike(value: unknown): value is ErrorLikeShape {
	return isRecord(value);
}

function coerceStatus(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}

function coerceString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function pickMessage(source: ErrorLikeShape, fallbackMessage: string): string {
	const fromMessage = coerceString(source.message);
	if (fromMessage) return fromMessage;

	const fromDescription = coerceString(source.error_description);
	if (fromDescription) return fromDescription;

	const fromError = coerceString(source.error);
	if (fromError) return fromError;

	return fallbackMessage;
}

/**
 * Normalizes unknown error shapes coming from HTTP clients, better-auth, and fetch.
 * Ensures we always have a stable message, code, status, and high-level kind.
 *
 * DX: Call this at React-query `onError` boundaries and centralize UX decisions
 * (toast variant, inline vs global errors) based on `kind` / `status`.
 */
export function normalizeClientError(
	error: unknown,
	fallbackMessage: string,
): NormalizedClientError {
	if (error == null) {
		return {
			message: fallbackMessage,
			kind: "unknown",
		};
	}

	if (typeof error === "string") {
		const message = error.trim() || fallbackMessage;
		return {
			message,
			kind: inferKind({ message }),
		};
	}

	if (error instanceof Error) {
		const possible = error as Error &
			Partial<{ status: unknown; code: unknown }>;
		const status = coerceStatus(possible.status);
		const code = coerceString(possible.code);
		const message = possible.message || fallbackMessage;

		return {
			message,
			status,
			code,
			kind: inferKind({ status, code, message }),
		};
	}

	if (isErrorLike(error)) {
		const message = pickMessage(error, fallbackMessage);
		const status = coerceStatus(error.status);
		const rawCode = error.code ?? error.error;
		const code = coerceString(rawCode);

		return {
			message,
			status,
			code,
			kind: inferKind({ status, code, message }),
		};
	}

	return {
		message: fallbackMessage,
		kind: "unknown",
	};
}

function inferKind(input: {
	status?: number;
	code?: string;
	message?: string;
}): NormalizedClientErrorKind {
	const { status, code, message } = input;
	const codeLower = code?.toLowerCase() ?? "";
	const messageLower = message?.toLowerCase() ?? "";

	if (
		status === 429 ||
		codeLower.includes("rate") ||
		messageLower.includes("too many requests")
	) {
		return "rate_limit";
	}

	if (status && status >= 400 && status < 500) {
		if (
			codeLower.includes("otp") ||
			codeLower.includes("code") ||
			codeLower.includes("invalid")
		) {
			return "validation";
		}

		if (codeLower.includes("auth") || codeLower.includes("unauthorized")) {
			return "auth";
		}

		return "validation";
	}

	if (status && status >= 500) {
		return "network";
	}

	return "unknown";
}
