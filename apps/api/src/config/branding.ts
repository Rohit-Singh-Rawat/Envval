/**
 * Centralized branding configuration for all outbound communications.
 * Change these values to rebrand emails, notifications, etc.
 *
 * Logo URL and support email are configurable via env vars so they can
 * be updated without a redeploy (e.g. CDN migration, domain change).
 */
export const branding = {
	productName: 'Envval',
	supportEmail: process.env.SUPPORT_EMAIL ?? 'support@envval.dev',
	/** Absolute URL to a hosted PNG/JPG logo. Email clients do not support SVGs. */
	logoUrl: process.env.EMAIL_LOGO_URL ?? '',
	/** Absolute URL to a welcome banner image shown at the top of the welcome email. */
	welcomeImageUrl: process.env.WELCOME_IMAGE_URL ?? '',
} as const;
