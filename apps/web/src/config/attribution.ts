export const ATTRIBUTION_SOURCE_VALUES = [
	"google",
	"twitter",
	"linkedin",
	"youtube",
	"producthunt",
	"hackernews",
	"reddit",
	"friend",
	"blog",
	"podcast",
	"other",
] as const;

export type AttributionSource = (typeof ATTRIBUTION_SOURCE_VALUES)[number];

export const ATTRIBUTION_SOURCE_OPTIONS: ReadonlyArray<{
	value: AttributionSource;
	label: string;
}> = [
	{ value: "google", label: "Google Search" },
	{ value: "twitter", label: "Twitter / X" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "youtube", label: "YouTube" },
	{ value: "producthunt", label: "Product Hunt" },
	{ value: "hackernews", label: "Hacker News" },
	{ value: "reddit", label: "Reddit" },
	{ value: "friend", label: "Friend / Colleague" },
	{ value: "blog", label: "Blog / Article" },
	{ value: "podcast", label: "Podcast" },
	{ value: "other", label: "Other" },
] as const;

export const ATTRIBUTION_MEDIUM_VALUES = [
	"organic",
	"social",
	"referral",
	"ad",
	"direct",
	"other",
] as const;

export type AttributionMedium = (typeof ATTRIBUTION_MEDIUM_VALUES)[number];

export const ATTRIBUTION_MEDIUM_OPTIONS: ReadonlyArray<{
	value: AttributionMedium;
	label: string;
}> = [
	{ value: "organic", label: "Organic search" },
	{ value: "social", label: "Social media" },
	{ value: "referral", label: "Referral" },
	{ value: "ad", label: "Advertisement" },
	{ value: "direct", label: "Direct link" },
	{ value: "other", label: "Other" },
] as const;
