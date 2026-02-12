import { authClient } from '@/lib/auth-client';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import type { AuthType } from '@envval/api/hc';

// Session shape as inferred from the Better Auth server instance
type Session = AuthType['$Infer']['Session'];

function isUserOnboarded(session: Session | null | undefined): boolean {
	return session?.user?.onboarded ?? false;
}

// Shared guards so we don't duplicate redirect logic everywhere
export function redirectIfAuthenticatedGuard(session: Session | null | undefined): void {
	if (session) {
		throw redirect({ to: '/dashboard' });
	}
}

export function redirectIfOnboardedGuard(session: Session | null | undefined): void {
	if (isUserOnboarded(session)) {
		throw redirect({ to: '/dashboard' });
	}
}

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});

	const url = new URL(request.url);
	const currentPath = url.pathname + url.search;

	if (!session) {
		throw redirect({ to: '/login', search: { redirectUrl: currentPath } });
	}
	if (!isUserOnboarded(session)) {
		throw redirect({ to: '/onboarding' });
	}

	return next();
});

export const redirectIfAuthenticatedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});

		redirectIfAuthenticatedGuard(session);

		return next();
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

		redirectIfOnboardedGuard(session);

		return next();
	}
);

export const homePageMiddleware = createMiddleware().server(async ({ next, request }) => {
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});
	if (session) {
		throw redirect({ to: '/dashboard' });
	}

	return next();
});
