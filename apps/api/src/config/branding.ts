import { env } from "./env";

/**
 * Centralized branding configuration for all outbound communications.
 *
 * Image URLs and support email are configurable via env vars
 * so they can be swapped without a redeploy (e.g. CDN migration).
 */
export const branding = {
  productName: "Envval",
  supportEmail: env.SUPPORT_EMAIL ?? "support@envval.dev",
  logoUrl: env.EMAIL_LOGO_URL,
  welcomeImageUrl: env.WELCOME_IMAGE_URL,
} as const;
