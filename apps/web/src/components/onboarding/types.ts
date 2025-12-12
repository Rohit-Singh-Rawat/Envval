import { z } from 'zod';

export const onboardingSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().optional(),
	source: z.string().min(1, 'Please select where you heard about us'),
	medium: z.string().min(1, 'Please select how you found us'),
	details: z.string().optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

