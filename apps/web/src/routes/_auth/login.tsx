import { createFileRoute } from '@tanstack/react-router';
import Authenticate from '@/components/auth/authenticate';

export const Route = createFileRoute('/_auth/login')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className='flex flex-col min-h-screen relative items-center justify-center max-w-2xl mx-auto bg-background px-4 '>
			<Authenticate mode='login' />
		</main>
	);
}
