import SectionHeading from "../section-heading";
import BentoCard from "./bento-card";
import CommandCenterIllustration from "./command-center";
import IntegrationsIllustration from "./integrations";
import SecureSyncIllustration from "./secure-sync";
import SneakPeekIllustration from "./sneak-peek";

const FeaturesGrid = () => (
	// biome-ignore lint/correctness/useUniqueElementIds: hash anchor for /#features URL navigation
	<section
		id="features"
		className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 py-16 sm:py-20 md:py-28"
	>
		<SectionHeading
			label="Features"
			heading="Everything your secrets need"
			text="From secure sync to real-time previews, Envval gives your team the tools to manage environment variables without compromise."
		/>
		<FeaturesGridContent />
	</section>
);

export default FeaturesGrid;

export const FeaturesGridContent = () => (
	<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
		<BentoCard
			title="Secure Sync"
			description="Edit an env on one device and it syncs instantly across every connected environment, encrypted end-to-end."
			className="lg:col-span-3"
		>
			<SecureSyncIllustration />
		</BentoCard>

		<BentoCard
			title="Integrations"
			description="Works with GitHub, Vercel, Docker, Slack, and the tools you already use. Secrets flow where your code runs."
			className="lg:col-span-2"
		>
			<IntegrationsIllustration />
		</BentoCard>

		<BentoCard
			title="Sneak Peek"
			description="Hover over any env reference in your code to preview its value instantly, right inside your editor."
			className="lg:col-span-2"
		>
			<SneakPeekIllustration />
		</BentoCard>

		<BentoCard
			title="Command Center"
			description="See every device and environment file in one place. Know what's synced, what's pending, and who has access."
			className="lg:col-span-3"
		>
			<CommandCenterIllustration />
		</BentoCard>
	</div>
);
