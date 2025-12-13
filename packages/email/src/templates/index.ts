import type { RenderedEmail, TemplateName, OtpEmailData, WelcomeEmailData } from '../types';
import { previewData as otpPreview, render as renderOtp } from './otp-email';
import { previewData as welcomePreview, render as renderWelcome } from './welcome-email';

export type TemplateDataMap = {
	otp: OtpEmailData;
	welcome: WelcomeEmailData;
};

const renderers: {
	[K in TemplateName]: (data: TemplateDataMap[K]) => RenderedEmail;
} = {
	otp: renderOtp,
	welcome: renderWelcome,
};

export const renderTemplate = <T extends TemplateName>(
	template: T,
	data: TemplateDataMap[T]
): RenderedEmail => {
	const render = renderers[template] as (data: TemplateDataMap[T]) => RenderedEmail;
	if (!render) {
		throw new Error(`No renderer found for template: ${template}`);
	}

	return render(data);
};

export const templatePreviewData: Record<TemplateName, TemplateDataMap[TemplateName]> = {
	otp: otpPreview,
	welcome: welcomePreview,
};
