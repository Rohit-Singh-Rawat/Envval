import { authClient } from '@/lib/auth-client';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});

	const url = new URL(request.url);
	const currentPath = url.pathname + url.search;

	if (!session) {
		return redirect({ to: '/login', search: { redirectUrl: currentPath } });
	}
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
		if (!session) {
			const url = new URL(request.url);
			const currentPath = url.pathname + url.search;
			throw redirect({ to: '/login', search: { redirectUrl: currentPath } });
		}
		if (session?.user.onboarded) {
			throw redirect({ to: '/dashboard' });
		}

		return await next();
	}
);

export const homePageMiddleware = createMiddleware().server(async ({ next, request }) => {
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});
	if(session) {
		return redirect({ to: '/dashboard' });
	}

	return await next();
});