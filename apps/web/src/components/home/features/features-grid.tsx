'use client';

import SectionHeading from '../section-heading';
import BentoCard from './bento-card';
import SecureSyncIllustration from './secure-sync';
import SneakPeekIllustration from './sneak-peek';
import CommandCenterIllustration from './command-center';
import IntegrationsIllustration from './integrations';

/**
 * Features bento grid layout:
 * - Top row: 3fr + 2fr (Secure Sync, Integrations)
 * - Bottom row: 2fr + 3fr (Sneak Peek, Command Center)
 */
const FeaturesGrid = () => (
	<section
		id='features'
		className='container max-w-7xl mx-auto px-20 py-20 md:py-28'
	>
		<SectionHeading
			label='Features'
			heading='Everything your secrets need'
			text='From secure sync to real-time previews, Envval gives your team the tools to manage environment variables without compromise.'
		/>
		<FeaturesGridContent />
	</section>
);

export default FeaturesGrid;

export const FeaturesGridContent = () => {
	return (
		<div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
			{/* Top row: 3/5 + 2/5 */}
			<BentoCard
				title='Secure Sync'
				description='Edit an env on one device and it syncs instantly across every connected environment, encrypted end-to-end.'
				className='lg:col-span-3'
			>
				<SecureSyncIllustration />
			</BentoCard>

			<BentoCard
				title='Integrations'
				description='Works with GitHub, Vercel, Docker, Slack, and the tools you already use. Secrets flow where your code runs.'
				className='lg:col-span-2'
			>
				<IntegrationsIllustration />
			</BentoCard>

			{/* Bottom row: 2/5 + 3/5 */}
			<BentoCard
				title='Sneak Peek'
				description='Hover over any env reference in your code to preview its value instantly, right inside your editor.'
				className='lg:col-span-2'
			>
				<SneakPeekIllustration />
			</BentoCard>

			<BentoCard
				title='Command Center'
				description="See every device and environment file in one place. Know what's synced, what's pending, and who has access."
				className='lg:col-span-3'
			>
				<CommandCenterIllustration />
			</BentoCard>
		</div>
	);
};
