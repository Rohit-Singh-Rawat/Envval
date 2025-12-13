import type { SendEmailPayload, TemplateName, OtpEmailData, WelcomeEmailData } from './schema';
import type { EmailSendResult } from './provider';

export interface RenderedEmail {
	subject: string;
	text?: string;
	html?: string;
}

export interface SendEmailResult extends EmailSendResult {
	template: TemplateName;
	to: SendEmailPayload['to'];
}

export type { SendEmailPayload, TemplateName, OtpEmailData, WelcomeEmailData };
