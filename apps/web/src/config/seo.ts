import { env } from "@/env";

export const siteConfig = {
	name: env.VITE_APP_TITLE || "EnvVal",
	description: env.VITE_APP_DESCRIPTION,
	url: env.VITE_APP_URL,
	ogImage: env.VITE_OG_IMAGE,
	author: "Rohit Singh Rawat",
	twitter: "@Spacing_whale",
	twitterCreator: "@Spacing_whale",
	keywords: [
		"env",
		"environment variables",
		"sync",
		"secure",
		"developer tools",
		"devops",
		"secrets management",
		".env",
	],
	themeColor: "var(--background)",
};

const siteTitle = `${siteConfig.name} - Secure Environment Variable Management`;

export const defaultMetadata = [
	{ charSet: "utf-8" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
	{ title: siteTitle },
	{ name: "description", content: siteConfig.description },
	{ name: "keywords", content: siteConfig.keywords.join(", ") },
	{ name: "author", content: siteConfig.author },
	{ name: "theme-color", content: siteConfig.themeColor },
	{ property: "og:type", content: "website" },
	{ property: "og:url", content: siteConfig.url },
	{ property: "og:title", content: siteTitle },
	{ property: "og:description", content: siteConfig.description },
	{ property: "og:image", content: siteConfig.ogImage },
	{ property: "og:site_name", content: siteConfig.name },
	{ name: "twitter:card", content: "summary_large_image" },
	{ name: "twitter:site", content: siteConfig.twitter },
	{ name: "twitter:creator", content: siteConfig.twitterCreator },
	{ name: "twitter:title", content: siteTitle },
	{ name: "twitter:description", content: siteConfig.description },
	{ name: "twitter:image", content: siteConfig.ogImage },
];
