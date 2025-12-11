export { emailConfig } from './config';
export { ensureIdempotencyKey, renderEmailTemplate, sendEmail } from './send';
export { getEmailProvider } from './provider';
export { renderTemplate, templatePreviewData, type TemplateDataMap } from './templates';
export type {
	SendEmailPayload,
	TemplateName,
	OtpEmailData,
	SendEmailResult,
	RenderedEmail,
} from './types';

