export const SOCIAL_LINKS = {
	twitter: "https://twitter.com/Spacing_whale",
	github: "https://github.com/Rohit-Singh-Rawat",
} as const;

export const CONTACT_EMAILS = {
	support: "rohitsrawat3002@gmail.com",
	security: "rohitsrawat3002@gmail.com",
	privacy: "rohitsrawat3002@gmail.com",
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;
export type ContactEmailKey = keyof typeof CONTACT_EMAILS;
