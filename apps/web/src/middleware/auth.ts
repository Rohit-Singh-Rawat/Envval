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
	console.log('[authMiddleware] Request headers:', request.headers.get('cookie') ?? 'No cookie');
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
		console.log('[redirectIfAuthenticatedMiddleware] Starting auth check');
		console.log('[redirectIfAuthenticatedMiddleware] Request headers:', request.headers.get('cookie') ?? 'No cookie');
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		redirectIfAuthenticatedGuard(session);
		return next();
	}
);

export const redirectIfOnboardedMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		console.log('[redirectIfOnboardedMiddleware] Starting auth check');
		console.log('[redirectIfOnboardedMiddleware] Request headers:', request.headers.get('cookie') ?? 'No cookie');
		const { data: session } = await authClient.getSession({
			fetchOptions: { headers: request.headers },
		});
		if (!session) {
			const url = new URL(request.url);
			throw redirect({ to: '/login', search: { redirectUrl: url.pathname + url.search } });
		}
		redirectIfOnboardedGuard(session);
		return next();
	}
);

export const homePageMiddleware = createMiddleware().server(async ({ next, request }) => {
	console.log('[homePageMiddleware] Starting auth check');
	console.log('[homePageMiddleware] Request headers:', request.headers.get('cookie') ?? 'No cookie');
	const { data: session } = await authClient.getSession({
		fetchOptions: { headers: request.headers },
	});
	if (session) {
		throw redirect({ to: '/dashboard' });
	}
	return next();
});
