import { createFileRoute } from '@tanstack/react-router';
import { StaticPage } from '@/components/static/static-page';
import { siteConfig } from '@/config/seo';
import { SOCIAL_LINKS } from '@/config/socials';

export const Route = createFileRoute('/_marketing/about')({
	component: AboutPage,
	head: () => ({
		meta: [
			{ title: `About - ${siteConfig.name}` },
			{
				name: 'description',
				content: 'The story behind Envval. Why it exists and what it is trying to solve.',
			},
		],
	}),
});

function AboutPage() {
	return (
		<StaticPage title='About' subtitle='Why Envval exists.'>
			<p>
				Envval started as a personal frustration. After years of building projects, losing .env files,
				accidentally leaking secrets, and spending hours recreating API keys on new machines, I decided
				to build something simple to fix it.
			</p>

			<p>
				The idea is straightforward: your environment variables should be as portable as your code, but
				secure. Envval encrypts your .env files on your device before syncing them, so your secrets
				never leave your machine unprotected.
			</p>

			<h2>What Envval does</h2>
			<p>
				Envval is a VS Code extension that keeps your .env files in sync across all your devices.
				Edit a variable on your laptop and it is available on your desktop. Come back to an old project
				on a new machine and your environment is already set up.
			</p>

			<p>
				Everything is encrypted end-to-end. The sync server coordinates the transfer but never sees
				the actual values. Your secrets stay yours.
			</p>

			<h2>Who builds this</h2>
			<p>
				Envval is built by <a href={SOCIAL_LINKS.twitter} target='_blank' rel='noopener noreferrer'>Rohit Singh Rawat</a>.
				It is a solo project born out of a real need, not a startup pitch deck.
			</p>

			<p>
				If you have questions, feedback, or just want to say hello, you can find me
				on <a href={SOCIAL_LINKS.twitter} target='_blank' rel='noopener noreferrer'>Twitter/X</a> or <a href={SOCIAL_LINKS.github} target='_blank' rel='noopener noreferrer'>GitHub</a>.
			</p>
		</StaticPage>
	)
}
