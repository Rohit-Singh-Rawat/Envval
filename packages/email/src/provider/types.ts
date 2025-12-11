export type EmailRecipient = string | string[];

export interface EmailMessage {
	to: EmailRecipient;
	from: string;
	replyTo?: string;
	subject: string;
	text?: string;
	html?: string;
}

export interface EmailSendResult {
	id?: string;
	status: 'sent' | 'queued' | 'failed';
	provider: string;
	error?: string;
	raw?: unknown;
}

export interface EmailProvider {
	name: string;
	send(message: EmailMessage): Promise<EmailSendResult>;
}

