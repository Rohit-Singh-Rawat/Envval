import { z } from "zod";
import {
	ATTRIBUTION_MEDIUM_VALUES,
	ATTRIBUTION_SOURCE_VALUES,
} from "@/config/attribution";

export const onboardingSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().optional(),
	source: z
		.enum(ATTRIBUTION_SOURCE_VALUES, {
			required_error: "Please select where you heard about us",
		})
		.optional(),
	medium: z
		.enum(ATTRIBUTION_MEDIUM_VALUES, {
			required_error: "Please select how you found us",
		})
		.optional(),
	details: z.string().optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
