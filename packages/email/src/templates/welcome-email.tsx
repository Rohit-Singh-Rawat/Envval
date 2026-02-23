import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { WelcomeEmailData } from "../schema";
import {
  EmailLayout,
  HeroImage,
  StepList,
  PrimaryButton,
  type StepItem,
} from "./shared/email-layout";

const GETTING_STARTED_STEPS: readonly StepItem[] = [
  {
    title: "Install the editor extension",
    description:
      "Grab the Envval extension for VS Code. It lets you pull, push, and rotate secrets without ever leaving your editor.",
  },
  {
    title: "Create your first repository",
    description:
      "A repository maps to a project. Add your .env files and Envval encrypts them end-to-end before they leave your machine.",
  },
  {
    title: "Invite your team or connect another device",
    description:
      "Every change syncs instantly across all connected environments. No more pasting secrets in Slack.",
  },
];

const WelcomeEmailTemplate = ({
  name,
  welcomeImageUrl,
  dashboardUrl,
  productName = "Envval",
}: WelcomeEmailData): React.ReactElement => (
  <EmailLayout productName={productName} hideBranding>
    {welcomeImageUrl && (
      <HeroImage src={welcomeImageUrl} alt={`Welcome to ${productName}`} />
    )}

    <h1 style={{ fontSize: "24px", margin: "0 0 16px 0", fontWeight: 600 }}>
      Welcome aboard, {name}!
    </h1>

    <p
      style={{
        margin: "0 0 16px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      Hey {name}, I'm Rohit. I built {productName}. Really glad you're here.
    </p>

    <p
      style={{
        margin: "0 0 16px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      I made {productName} because I was tired of the same painful routine,
      hunting down .env files, pasting secrets in DMs, hoping everyone's on the
      right version. It encrypts everything end-to-end and keeps your secrets
      synced across every device and teammate. Simple as that.
    </p>

    <p
      style={{
        margin: "0 0 24px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      Best way to get a feel for it is to throw something real at it. Here's
      where I'd start:
    </p>

    <StepList steps={GETTING_STARTED_STEPS} />

    {dashboardUrl && (
      <PrimaryButton href={dashboardUrl} label="Go to your dashboard" />
    )}

    <p
      style={{
        margin: "24px 0 16px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      Once it's set up, you won't think about it. Your secrets just stay safe
      and in sync while you focus on building.
    </p>

    <p
      style={{
        margin: "0 0 16px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      If anything feels off or you have questions, just hit reply. I personally
      read every message and I'd love to hear from you.
    </p>

    <p
      style={{
        margin: "0 0 4px 0",
        color: "#444",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      Cheers,
    </p>
    <p
      style={{
        margin: "0 0 0 0",
        color: "#1a1a1a",
        fontSize: "15px",
        fontWeight: 600,
      }}
    >
      Rohit
    </p>
    <p style={{ margin: "0", color: "#888", fontSize: "13px" }}>
      Founder, {productName}
    </p>
  </EmailLayout>
);

function stepsToPlainText(steps: readonly StepItem[]): string {
  return steps
    .map((step, i) => `${i + 1}. ${step.title}\n   ${step.description}`)
    .join("\n\n");
}

export const render = (data: WelcomeEmailData) => {
  const { name, productName = "Envval", dashboardUrl } = data;

  const subject = `Welcome to ${productName}, ${name}!`;
  const html = renderToStaticMarkup(<WelcomeEmailTemplate {...data} />);

  const text = [
    productName,
    "",
    `Welcome aboard, ${name}!`,
    "",
    `Hey ${name}, I'm Rohit. I built ${productName}. Really glad you're here.`,
    "",
    `I made ${productName} because I was tired of the same painful routine, hunting down .env files, pasting secrets in DMs, hoping everyone's on the right version. It encrypts everything end-to-end and keeps your secrets synced across every device and teammate. Simple as that.`,
    "",
    `Best way to get a feel for it is to throw something real at it. Here's where I'd start:`,
    "",
    stepsToPlainText(GETTING_STARTED_STEPS),
    "",
    ...(dashboardUrl ? [`Go to your dashboard: ${dashboardUrl}`, ""] : []),
    `Once it's set up, you won't think about it. Your secrets just stay safe and in sync while you focus on building.`,
    "",
    `If anything feels off or you have questions, just hit reply. I personally read every message and I'd love to hear from you.`,
    "",
    "Cheers,",
    "Rohit",
    `Founder, ${productName}`,
  ].join("\n");

  return { subject, text, html };
};

export const previewData: WelcomeEmailData = {
  name: "Rohit",
  logoUrl: "",
  welcomeImageUrl: "",
  dashboardUrl: "https://envval.dev/dashboard",
  supportEmail: "support@envval.dev",
  productName: "Envval",
};
