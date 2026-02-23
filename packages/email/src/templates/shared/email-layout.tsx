import * as React from "react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface EmailLayoutProps {
  productName?: string;
  /** Absolute URL to a hosted logo image (PNG/JPG). SVGs are not supported by most email clients. */
  logoUrl?: string;
  hideBranding?: boolean;
  children: React.ReactNode;
}

/** Shared layout wrapper for all transactional emails. */
export const EmailLayout = ({
  productName = "Envval",
  logoUrl,
  hideBranding = false,
  children,
}: EmailLayoutProps): React.ReactElement => (
  <div
    style={{
      fontFamily: FONT_STACK,
      maxWidth: "500px",
      margin: "0 auto",
      padding: "40px 32px",
      color: "#1a1a1a",
    }}
  >
    {!hideBranding && (
      <div style={{ marginBottom: "32px" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={productName}
            width="48"
            height="48"
            style={{ display: "block" }}
          />
        ) : (
          <strong style={{ fontSize: "18px", letterSpacing: "-0.01em" }}>
            {productName}
          </strong>
        )}
      </div>
    )}
    {children}
    <div
      style={{
        marginTop: "40px",
        paddingTop: "24px",
        borderTop: "1px solid #eee",
      }}
    >
      <p
        style={{ margin: 0, color: "#999", fontSize: "12px", lineHeight: 1.5 }}
      >
        &copy; {new Date().getFullYear()} {productName}. All rights reserved.
      </p>
    </div>
  </div>
);

interface InfoBoxProps {
  rows: ReadonlyArray<{ label: string; value: string }>;
}

/** Grey info box used to display structured key-value data in emails. */
export const InfoBox = ({ rows }: InfoBoxProps): React.ReactElement => (
  <div
    style={{
      backgroundColor: "#f6f6f6",
      padding: "20px 24px",
      borderRadius: "8px",
      marginBottom: "24px",
    }}
  >
    {rows.map((row) => (
      <div key={row.label} style={{ marginBottom: "8px" }}>
        <span style={{ color: "#666", fontSize: "14px", fontWeight: 600 }}>
          {row.label}:{" "}
        </span>
        <span style={{ color: "#1a1a1a", fontSize: "14px" }}>{row.value}</span>
      </div>
    ))}
  </div>
);

interface PrimaryButtonProps {
  href: string;
  label: string;
}

export const PrimaryButton = ({
  href,
  label,
}: PrimaryButtonProps): React.ReactElement => (
  <div style={{ marginBottom: "16px" }}>
    <a
      href={href}
      style={{
        backgroundColor: "#5b7cf7",
        color: "#ffffff",
        padding: "12px 32px",
        borderRadius: "6px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {label}
    </a>
  </div>
);

export interface StepItem {
  title: string;
  description: string;
}

/** Numbered step list for onboarding / getting-started flows. */
export const StepList = ({
  steps,
}: {
  steps: ReadonlyArray<StepItem>;
}): React.ReactElement => (
  <div style={{ marginBottom: "24px" }}>
    {steps.map((step) => (
      <div
        key={step.title}
        style={{ marginBottom: "16px", paddingLeft: "8px" }}
      >
        <p
          style={{
            margin: "0 0 4px 0",
            fontSize: "15px",
            fontWeight: 500,
            color: "#1a1a1a",
          }}
        >
          {step.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </p>
      </div>
    ))}
  </div>
);

/** Full-width hero image for email headers (welcome banners, announcements). */
export const HeroImage = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}): React.ReactElement => (
  <div style={{ marginBottom: "24px" }}>
    <img
      src={src}
      alt={alt}
      width="100%"
      height="auto"
      style={{
        display: "block",
        maxWidth: "100%",
        height: "auto",
        borderRadius: "8px",
      }}
    />
  </div>
);

export const Muted = ({
  children,
  size = 13,
}: {
  children: React.ReactNode;
  size?: number;
}): React.ReactElement => (
  <p
    style={{
      margin: "0 0 8px 0",
      color: "#888",
      fontSize: `${size}px`,
      lineHeight: 1.5,
    }}
  >
    {children}
  </p>
);
