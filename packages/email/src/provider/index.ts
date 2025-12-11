import { emailConfig } from '../config';
import { createResendProvider } from './resend';
import type { EmailMessage, EmailProvider, EmailSendResult } from './types';

let cachedProvider: EmailProvider | null = null;

export const getEmailProvider = (): EmailProvider => {
	if (cachedProvider) return cachedProvider;

	switch (emailConfig.provider) {
		case 'resend':
			cachedProvider = createResendProvider(emailConfig.resendApiKey);
			return cachedProvider;
		default:
			throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
	}
};

export type { EmailMessage, EmailProvider, EmailSendResult };
