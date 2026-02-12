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
	console.log('[authMiddleware] Starting auth check');
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});
	console.log('[authMiddleware] Session:', session ? `User: ${session.user?.id}` : 'No session');

	const url = new URL(request.url);
	const currentPath = url.pathname + url.search;
	console.log('[authMiddleware] Current path:', currentPath);

	if (!session) {
		console.log('[authMiddleware] No session, redirecting to login');
		throw redirect({ to: '/login', search: { redirectUrl: currentPath } });
	}
	if (!isUserOnboarded(session)) {
		console.log('[authMiddleware] User not onboarded, redirecting to onboarding');
		throw redirect({ to: '/onboarding' });
	}

	console.log('[authMiddleware] Auth check passed');
	return next();
});

export const redirectIfAuthenticatedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		console.log('[redirectIfAuthenticatedMiddleware] Starting check');
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		console.log('[redirectIfAuthenticatedMiddleware] Session:', session ? `User: ${session.user?.id}` : 'No session');

		redirectIfAuthenticatedGuard(session);

		console.log('[redirectIfAuthenticatedMiddleware] Check passed');
		return next();
	}
);

export const redirectIfOnboardedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		console.log('[redirectIfOnboardedMiddleware] Starting check');
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		console.log('[redirectIfOnboardedMiddleware] Session:', session ? `User: ${session.user?.id}` : 'No session');

		if (!session) {
			const url = new URL(request.url);
			const currentPath = url.pathname + url.search;
			console.log('[redirectIfOnboardedMiddleware] No session, redirecting to login');
			throw redirect({ to: '/login', search: { redirectUrl: currentPath } });
		}

		redirectIfOnboardedGuard(session);

		console.log('[redirectIfOnboardedMiddleware] Check passed');
		return next();
	}
);

export const homePageMiddleware = createMiddleware().server(async ({ next, request }) => {
	console.log('[homePageMiddleware] Starting check');
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});
	console.log('[homePageMiddleware] Session:', session ? `User: ${session.user?.id}` : 'No session');

	if (session) {
		console.log('[homePageMiddleware] User authenticated, redirecting to dashboard');
		throw redirect({ to: '/dashboard' });
	}

	console.log('[homePageMiddleware] Check passed');
	return next();
});
