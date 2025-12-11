import { createHash } from 'crypto';
import type { SendEmailPayload } from './schema';

export const makeIdempotencyKey = (payload: SendEmailPayload): string => {
	const hash = createHash('sha256');
	hash.update(
		JSON.stringify({
			to: payload.to,
			template: payload.template,
			data: payload.data,
			from: payload.from,
		})
	);
	return hash.digest('hex');
};
