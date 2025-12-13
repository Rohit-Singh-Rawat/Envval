import { createHandler } from '@/shared/utils/factory';
import { z } from 'zod';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { UserService } from '@/modules/auth/user.service';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';
import { HTTPException } from 'hono/http-exception';

const userService = new UserService();
const onboardingService = new OnboardingService();

export const postOnboardingHandler = createHandler({
	schema: {
		json: z.object({
			name: z.string().min(1),
			lastName: z.string().optional(),
			source: z.string().optional().nullable(),
			medium: z.string().optional().nullable(),
			details: z.string().optional().nullable(),
		}),
	},
	middleware: [authMiddleware],
	handler: async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			throw new HTTPException(401, { message: 'Unauthorized' });
		}

		// Data is already validated by zValidator middleware
		const body = (ctx.req as any).valid?.('json') || (await ctx.req.json());
		const { name, lastName, source, medium, details } = body;

		// Combine name and lastName if lastName is provided
		const fullName = lastName ? `${name} ${lastName}`.trim() : name;

		// Get request metadata
		const ipAddress = ctx.req.header('x-forwarded-for') || ctx.req.header('x-real-ip') || null;
		const userAgent = ctx.req.header('user-agent') || null;
		const referrerUrl = ctx.req.header('referer') || null;

		// Update user name
		await userService.updateUser(user.id, { name: fullName }, ctx.req.raw.headers);

		// Add user attribution if provided
		if (source || medium || details) {
			await onboardingService.addUserAttribute(user.id, {
				source: source ?? null,
				medium: medium ?? null,
				details: details ?? null,
				referrerUrl,
				ipAddress,
				userAgent,
			});
		}

		// Complete onboarding
		await onboardingService.completeOnboarding(user.id, ctx.req.raw.headers);

		// Send welcome email
		await onboardingService.sendWelcomeEmail(user.id, fullName);
		return ctx.json({
			message: 'Onboarding completed successfully',
			user: {
				id: user.id,
				name: fullName,
				onboarded: true,
			},
		});
	},
});
