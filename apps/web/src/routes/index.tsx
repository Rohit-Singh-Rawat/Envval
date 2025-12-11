import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: App });

function App() {
	return (
		<div className='p-8 space-y-4'>
			<h1 className='text-2xl font-bold'>Home</h1>
		</div>
	);
}
