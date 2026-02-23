import { emailConfig } from "./config";
import { makeIdempotencyKey } from "./idempotency";
import { getEmailProvider } from "./provider";
import { renderTemplate, type TemplateDataMap } from "./templates";
import type { SendEmailPayload, TemplateName } from "./schema";
import { validateSendEmailPayload } from "./schema";
import type { SendEmailResult } from "./types";

export const sendEmail = async (
  payload: SendEmailPayload,
): Promise<SendEmailResult> => {
  try {
    const validated = validateSendEmailPayload(payload);
    const provider = getEmailProvider();
    const rendered = renderTemplate(validated.template, validated.data);

    const message = {
      to: validated.to,
      from: validated.from ?? emailConfig.from ?? "",
      replyTo: validated.replyTo ?? emailConfig.replyTo,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    };

    const result = await provider.send(message);

    if (result.status === "failed") {
      throw new Error(
        `Email send failed via ${result.provider}: ${result.error ?? "unknown error"}`,
      );
    }

    return {
      ...result,
      template: validated.template,
      to: validated.to,
    };
  } catch (error) {
    throw error;
  }
};

export const ensureIdempotencyKey = (payload: SendEmailPayload): string =>
  payload.idempotencyKey ?? makeIdempotencyKey(payload);

export const renderEmailTemplate = <T extends TemplateName>(
  template: T,
  data: TemplateDataMap[T],
) => renderTemplate(template, data);
