import { z } from "zod";

const emailAddress = z.string().email();
const recipients = z.union([emailAddress, z.array(emailAddress).nonempty()]);
/** Accepts both plain email and display name format: "Name <email@example.com>" */
const fromAddress = z.string().min(1);

export const otpEmailDataSchema = z.object({
  otp: z.string(),
  logoUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  productName: z.string().optional(),
});

export const welcomeEmailDataSchema = z.object({
  name: z.string(),
  logoUrl: z.string().url().optional(),
  welcomeImageUrl: z.string().url().optional(),
  dashboardUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  productName: z.string().optional(),
});

export const newRepoEmailDataSchema = z.object({
  userName: z.string(),
  repoName: z.string(),
  repoUrl: z.string().optional(),
  logoUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  productName: z.string().optional(),
});

export const newDeviceEmailDataSchema = z.object({
  userName: z.string(),
  deviceName: z.string(),
  signInType: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  timestamp: z.string(),
  revokeUrl: z.string().optional(),
  supportEmail: z.string().optional(),
  logoUrl: z.string().url().optional(),
  productName: z.string().optional(),
});

export const templateNames = [
  "otp",
  "welcome",
  "new-repo",
  "new-device",
] as const;
export type TemplateName = (typeof templateNames)[number];

export const sendEmailPayloadSchema = z.discriminatedUnion("template", [
  z.object({
    to: recipients,
    from: fromAddress.optional(),
    replyTo: emailAddress.optional(),
    idempotencyKey: z.string().optional(),
    template: z.literal("otp"),
    data: otpEmailDataSchema,
  }),
  z.object({
    to: recipients,
    from: fromAddress.optional(),
    replyTo: emailAddress.optional(),
    idempotencyKey: z.string().optional(),
    template: z.literal("welcome"),
    data: welcomeEmailDataSchema,
  }),
  z.object({
    to: recipients,
    from: fromAddress.optional(),
    replyTo: emailAddress.optional(),
    idempotencyKey: z.string().optional(),
    template: z.literal("new-repo"),
    data: newRepoEmailDataSchema,
  }),
  z.object({
    to: recipients,
    from: fromAddress.optional(),
    replyTo: emailAddress.optional(),
    idempotencyKey: z.string().optional(),
    template: z.literal("new-device"),
    data: newDeviceEmailDataSchema,
  }),
]);

export type SendEmailPayload = z.infer<typeof sendEmailPayloadSchema>;
export type OtpEmailData = z.infer<typeof otpEmailDataSchema>;
export type WelcomeEmailData = z.infer<typeof welcomeEmailDataSchema>;
export type NewRepoEmailData = z.infer<typeof newRepoEmailDataSchema>;
export type NewDeviceEmailData = z.infer<typeof newDeviceEmailDataSchema>;

export const validateSendEmailPayload = (payload: unknown): SendEmailPayload =>
  sendEmailPayloadSchema.parse(payload);
