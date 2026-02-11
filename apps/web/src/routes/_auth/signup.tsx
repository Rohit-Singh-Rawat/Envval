import { createFileRoute } from '@tanstack/react-router';

import Authenticate from '@/components/auth/authenticate';

export const Route = createFileRoute('/_auth/signup')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className='flex min-h-screen items-center justify-center bg-background px-4'>
			<Authenticate mode='signup' />
		</main>
	);
}
