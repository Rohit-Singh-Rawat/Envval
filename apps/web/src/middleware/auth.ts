import { authClient } from '@/lib/auth-client';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});

	if (!session) {
		return redirect({ to: '/login' });
	}
	console.log(session.user);
	if (!session.user.onboarded) {
		return redirect({ to: '/welcome' });
	}

	return await next();
});

export const redirectIfAuthenticatedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		if (session) {
			throw redirect({ to: '/dashboard' });
		}

		return await next();
	}
);

export const redirectIfOnboardedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		if (session?.user.onboarded) {
			throw redirect({ to: '/dashboard' });
		}
		return await next();
	}
);
