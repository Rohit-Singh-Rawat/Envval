export const SOCIAL_LINKS = {
	twitter: 'https://twitter.com/rsr_crafts',
	github: 'https://github.com/rohitsinghrawat',
} as const;

export const CONTACT_EMAILS = {
	support: 'support@envval.com',
	security: 'security@envval.com',
	privacy: 'privacy@envval.com',
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;
export type ContactEmailKey = keyof typeof CONTACT_EMAILS;

