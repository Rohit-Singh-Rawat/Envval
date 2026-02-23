const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for email configuration`);
  }
  return value;
};

export const emailConfig = {
  provider: (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase(),
  from: process.env.EMAIL_FROM,
  replyTo: process.env.EMAIL_REPLY_TO,
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
