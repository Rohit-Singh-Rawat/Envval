import { FeaturesGridContent } from '@/components/home/features/features-grid';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/animation')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className='container max-w-7xl h-screen flex items-center justify-center mx-auto px-20'>
			<FeaturesGridContent />
		</div>
	);
}
