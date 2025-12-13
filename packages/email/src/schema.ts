import { z } from 'zod';

const emailAddress = z.string().email();
const recipients = z.union([emailAddress, z.array(emailAddress).nonempty()]);

export const otpEmailDataSchema = z.object({
	otp: z.string(),
	productName: z.string().optional(),
});

export const welcomeEmailDataSchema = z.object({
	name: z.string(),
	productName: z.string().optional(),
});

export const templateNames = ['otp', 'welcome'] as const;
export type TemplateName = (typeof templateNames)[number];

export const sendEmailPayloadSchema = z.discriminatedUnion('template', [
	z.object({
		to: recipients,
		from: emailAddress.optional(),
		replyTo: emailAddress.optional(),
		idempotencyKey: z.string().optional(),
		template: z.literal('otp'),
		data: otpEmailDataSchema,
	}),
	z.object({
		to: recipients,
		from: emailAddress.optional(),
		replyTo: emailAddress.optional(),
		idempotencyKey: z.string().optional(),
		template: z.literal('welcome'),
		data: welcomeEmailDataSchema,
	}),
]);

export type SendEmailPayload = z.infer<typeof sendEmailPayloadSchema>;
export type OtpEmailData = z.infer<typeof otpEmailDataSchema>;
export type WelcomeEmailData = z.infer<typeof welcomeEmailDataSchema>;

export const validateSendEmailPayload = (payload: unknown): SendEmailPayload =>
	sendEmailPayloadSchema.parse(payload);
