import type { RenderedEmail, TemplateName, OtpEmailData } from '../types';
import { previewData as otpPreview, render as renderOtp } from './otp-email';

export type TemplateDataMap = {
	otp: OtpEmailData;
};

const renderers: Record<TemplateName, (data: TemplateDataMap[TemplateName]) => RenderedEmail> = {
	otp: renderOtp,
};

export const renderTemplate = <T extends TemplateName>(
	template: T,
	data: TemplateDataMap[T]
): RenderedEmail => {
	const render = renderers[template];
	if (!render) {
		throw new Error(`No renderer found for template: ${template}`);
	}

	return render(data);
};

export const templatePreviewData: Record<TemplateName, TemplateDataMap[TemplateName]> = {
	otp: otpPreview,
};
