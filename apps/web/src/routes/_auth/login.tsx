import { createFileRoute } from '@tanstack/react-router';
import Authenticate from '@/components/auth/authenticate';
// import { Asterisk } from '@/components/logo/asterisk';
export const Route = createFileRoute('/_auth/login')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className='flex flex-col min-h-screen relative items-center justify-center max-w-2xl mx-auto bg-background px-4'>
			{/* <Asterisk className='size-40 absolute top-0 left-0 ' /> */}
			<Authenticate mode='login' />
			{/* <Asterisk className='size-40  absolute bottom-0 right-0' /> */}
		</main>
	)
}
