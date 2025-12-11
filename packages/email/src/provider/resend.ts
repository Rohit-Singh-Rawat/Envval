import { Resend, type CreateEmailOptions } from 'resend';
import type { EmailMessage, EmailProvider, EmailSendResult } from './types';

export const createResendProvider = (apiKey: string): EmailProvider => {
	if (!apiKey) {
		throw new Error('RESEND_API_KEY is required to initialize the Resend provider');
	}

	const client = new Resend(apiKey);

	const send = async (message: EmailMessage): Promise<EmailSendResult> => {
		const options = {
			from: message.from,
			to: message.to,
			replyTo: message.replyTo,
			subject: message.subject,
			text: message.text,
			html: message.html,
		} as CreateEmailOptions;

		const response = await client.emails.send(options);

		if (response.error) {
			return {
				status: 'failed',
				provider: 'resend',
				error: response.error.message,
				raw: response.error,
			};
		}

		return {
			id: response.data?.id,
			status: 'sent',
			provider: 'resend',
			raw: response.data,
		};
	};

	return {
		name: 'resend',
		send,
	};
};
