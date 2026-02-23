import type {
  RenderedEmail,
  TemplateName,
  OtpEmailData,
  WelcomeEmailData,
  NewRepoEmailData,
  NewDeviceEmailData,
} from "../types";
import { previewData as otpPreview, render as renderOtp } from "./otp-email";
import {
  previewData as welcomePreview,
  render as renderWelcome,
} from "./welcome-email";
import {
  previewData as newRepoPreview,
  render as renderNewRepo,
} from "./new-repo-email";
import {
  previewData as newDevicePreview,
  render as renderNewDevice,
} from "./new-device-email";

export * as otp from "./otp-email";
export * as welcome from "./welcome-email";
export * as newRepo from "./new-repo-email";
export * as newDevice from "./new-device-email";

export type TemplateDataMap = {
  otp: OtpEmailData;
  welcome: WelcomeEmailData;
  "new-repo": NewRepoEmailData;
  "new-device": NewDeviceEmailData;
};

const renderers: {
  [K in TemplateName]: (data: TemplateDataMap[K]) => RenderedEmail;
} = {
  otp: renderOtp,
  welcome: renderWelcome,
  "new-repo": renderNewRepo,
  "new-device": renderNewDevice,
};

export const renderTemplate = <T extends TemplateName>(
  template: T,
  data: TemplateDataMap[T],
): RenderedEmail => {
  const render = renderers[template] as (
    data: TemplateDataMap[T],
  ) => RenderedEmail;
  if (!render) {
    throw new Error(`No renderer found for template: ${template}`);
  }

  return render(data);
};

export const templatePreviewData: Record<
  TemplateName,
  TemplateDataMap[TemplateName]
> = {
  otp: otpPreview,
  welcome: welcomePreview,
  "new-repo": newRepoPreview,
  "new-device": newDevicePreview,
};
