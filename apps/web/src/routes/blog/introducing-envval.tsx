import { createFileRoute, Link } from '@tanstack/react-router';
import { BlogLayout } from '@/components/blog/blog-layout';
import {
	Prose,
	Paragraph,
	Heading,
	Blockquote,
	BlogImage,
	HighlightBox,
	List,
	CodeBlock,
	Divider,
} from '@/components/blog/blog-prose';
import { siteConfig } from '@/config/seo';
import { SOCIAL_LINKS } from '@/config/socials';

export const Route = createFileRoute('/blog/introducing-envval')({
	component: IntroducingEnvval,
	head: () => ({
		meta: [
			{ title: `Introducing Envval - ${siteConfig.name}` },
			{
				name: 'description',
				content:
					'The story behind Envval - why I built a secure environment variable management tool after years of .env frustrations.',
			},
			{ property: 'og:title', content: `Introducing Envval - ${siteConfig.name}` },
			{
				property: 'og:description',
				content:
					'The story behind Envval - why I built a secure environment variable management tool after years of .env frustrations.',
			},
			{ property: 'og:type', content: 'article' },
			{ property: 'og:image', content: `${siteConfig.url}${blogMetadata.coverImage}` },
			{ name: 'twitter:card', content: 'summary_large_image' },

			{ name: 'twitter:image', content: `${siteConfig.url}${blogMetadata.coverImage}` },
			{ name: 'article:author', content: siteConfig.author },
		],
	}),
});

const blogMetadata = {
	title: 'Introducing Envval',
	subtitle:
		'After building countless projects, I finally decided to fix the one problem that kept haunting me.',
	publishedAt: '2024-12-15',
	readingTime: '6 min read',
	coverImage: '/images/blog/introducing-envval/cover.png',
	author: {
		name: 'Rohit Singh Rawat',
		avatar: '/images/blog/introducing-envval/rohit.png',
	},
};

function IntroducingEnvval() {
	return (
		<BlogLayout metadata={blogMetadata}>
			<Prose>
				<Paragraph>
					It was 2 AM. I had been debugging for three hours, convinced there was a bug in my code.
					Turns out, my local <code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code>{' '}
					file had an outdated API key. Three hours. Gone.
				</Paragraph>

				<Paragraph>
					If you have built software for any amount of time, you know this feeling. That sinking
					realization that the problem was not your logic, not your database queries, not your API
					integration. It was a missing environment variable. Or worse, the wrong one.
				</Paragraph>
			</Prose>

			<Divider />

			<Prose>
				<Heading>The problem nobody talks about</Heading>

				<Paragraph>
					After building many projects (side projects, client work, experiments that never saw the
					light of day) I noticed a pattern. Every single time I returned to an old project,
					something was broken. Not the code. The environment.
				</Paragraph>

				<List
					items={[
						'The .env file I deleted months ago when "cleaning up" my machine',
						'API keys that expired or got rotated without me knowing',
						'Different values on my laptop versus my desktop',
						'That one time I accidentally pushed secrets to GitHub and had to rotate everything',
					]}
				/>

				<Paragraph>
					The worst part? Every developer I talked to had the same stories. We have all been there.
					We have all lost hours to this. And yet, we keep treating{' '}
					<code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code> files like they are
					disposable sticky notes instead of critical infrastructure.
				</Paragraph>
			</Prose>

			<Prose>
				<Heading>The breaking point</Heading>

				<Paragraph>
					A few months ago, I was revisiting a project I had not touched in over a year. I wanted to
					change domains and make a couple of updates. Simple enough, right? Except the entire{' '}
					<code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code> file was gone.
					Deleted. No backup. I spent an entire day recreating API keys, figuring out which services
					I used, and praying I remembered the right configuration.
				</Paragraph>

				<Blockquote>
					Why is there no simple way to sync my environment variables across devices, keep them
					secure, and never lose them again?
				</Blockquote>

				<Paragraph>That question would not leave me alone. So I started building.</Paragraph>
			</Prose>

			<Divider />

			<Prose>
				<Heading>Why not use what already exists?</Heading>

				<Paragraph>
					There are solutions out there. Vault, Doppler, Infisical, dotenv-vault, and a bunch of
					others. I tried some of them. They work. But honestly? They felt like too much for what I
					needed.
				</Paragraph>

				<Paragraph>
					Most of them are built for large teams with complex infrastructure needs. They come with
					dashboards, role-based access control, audit logs, SSO integrations, and a dozen other
					features I was never going to use. I just wanted to sync my{' '}
					<code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code> files across my
					devices without losing them.
				</Paragraph>

				<Paragraph>
					So I built something simple. Something that does one thing well, without the bloat. That
					is Envval.
				</Paragraph>
			</Prose>

			<Divider />

			<Prose>
				<Heading>What is Envval?</Heading>

				<Paragraph>
					Envval is a secure environment variable management tool. At its core, it keeps your{' '}
					<code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code> files in sync across
					all your devices, encrypted end-to-end, without you having to think about it.
				</Paragraph>

				<Paragraph>
					Edit an env file on your laptop, and it is instantly available on your desktop. Come back
					to an old project on a new machine, and your variables are already there waiting for you.
				</Paragraph>

				<HighlightBox>
					<Paragraph className='mb-0!'>
						<strong>The core idea:</strong> Your secrets should be as portable as your code, but
						infinitely more secure.
					</Paragraph>
				</HighlightBox>
			</Prose>

			<BlogImage
				src='/images/blog/introducing-envval/sync-flow.png'
				alt='Diagram showing how Envval syncs environment variables between devices'
				caption='Your secrets are encrypted locally before being synced through EnvVault'
			/>

			<Prose>
				<Heading>What it does</Heading>

				<Paragraph>
					I built this for myself first, which means every feature exists because I actually needed
					it. Here is what Envval can do right now:
				</Paragraph>

				<Paragraph>
					<strong>Secure Sync</strong> is the core of everything. Your env files are encrypted on
					your device before they leave. They sync through our relay server (EnvVault), which
					coordinates the sync but never sees the actual values. End-to-end encrypted, always.
				</Paragraph>

				<Paragraph>
					<strong>Sneak Peek</strong> lets you hover over any environment variable reference in your
					code and instantly see its value. Right inside VS Code. No more switching back and forth
					between your code and your .env file.
				</Paragraph>

				<Paragraph>
					<strong>Command Center</strong> is a simple dashboard where you can see all your devices,
					which projects are synced, and what is up to date versus what is pending. Nothing fancy,
					just visibility.
				</Paragraph>

				<Paragraph>
					Everything runs through a <strong>VS Code extension</strong>. Install it, log in, and you
					are good to go. No extra apps, no CLI tools to remember, no context switching.
				</Paragraph>
			</Prose>

			<Prose>
				<Heading as='h3'>How it works in practice</Heading>

				<Paragraph>
					The workflow is straightforward. Install the VS Code extension, log in, and point it at
					your project. Envval detects your{' '}
					<code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code> files automatically.
					From that moment on, any changes you make are encrypted and synced.
				</Paragraph>

				<CodeBlock
					code={`# These values are encrypted before leaving your machine
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_API_URL=https://api.example.com

# Envval syncs all standard .env formats
# .env, .env.local, .env.development, .env.production`}
				/>
			</Prose>

			<Divider />

			<Prose>
				<Heading>The tech behind it</Heading>

				<Paragraph>
					For those who care about what is under the hood: the frontend is built with React 19,
					TanStack Router, TanStack Query, and Tailwind CSS. Animations use the Motion library.
				</Paragraph>

				<Paragraph>
					The backend runs on Hono with Better Auth for authentication, Drizzle ORM for the
					database, and Upstash Redis for rate limiting. The VS Code extension is written in
					TypeScript and bundled with esbuild.
				</Paragraph>

				<Paragraph>
					The whole thing is a Turborepo monorepo managed with Bun. Nothing exotic, just solid,
					modern tools that work well together.
				</Paragraph>
			</Prose>

			<Divider />

			<Prose>
				<Heading>What is next</Heading>

				<Paragraph>
					Right now, Envval handles local development really well. But I have bigger plans:
				</Paragraph>

				<List
					items={[
						'Staging environments: separate configs for development, staging, and production so you never accidentally use prod keys locally',
						'Team sharing: securely share environment variables with your team and onboard new developers in minutes instead of hours',
						'CI/CD integrations: inject secrets directly into your deployment pipelines (GitHub Actions, Vercel, Railway, and more)',
					]}
				/>

				<Paragraph>
					These are coming. For now, the focus is on getting the core experience right.
				</Paragraph>
			</Prose>

			<Divider />

			<Prose>
				<Heading>Try it</Heading>

				<Paragraph>
					I built Envval because I was tired of losing hours to a problem that should not exist. If
					you have ever lost a <code className='text-sm bg-muted/60 px-1 py-0.5 rounded'>.env</code>{' '}
					file, accidentally exposed a secret, or spent way too long setting up a development
					environment, this is for you.
				</Paragraph>

				<Paragraph>
					The VS Code extension is in beta. It is free to use, and I would love to hear what you
					think.{' '}
					<Link
						to='/signup'
						className='underline underline-offset-4 hover:text-foreground'
					>
						Try it out
					</Link>
					.
				</Paragraph>

				<Paragraph className='text-sm text-muted-foreground mt-10'>
					Questions or feedback? Find me on{' '}
					<a
						href={SOCIAL_LINKS.twitter}
						target='_blank'
						rel='noopener noreferrer'
						className='underline underline-offset-4 hover:text-foreground'
					>
						Twitter/X
					</a>{' '}
					or{' '}
					<a
						href={SOCIAL_LINKS.github}
						target='_blank'
						rel='noopener noreferrer'
						className='underline underline-offset-4 hover:text-foreground'
					>
						GitHub
					</a>
					.
				</Paragraph>
			</Prose>
		</BlogLayout>
	);
}
