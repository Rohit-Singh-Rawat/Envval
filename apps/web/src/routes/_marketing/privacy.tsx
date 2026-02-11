import { createFileRoute } from '@tanstack/react-router';
import { StaticPage } from '@/components/static/static-page';
import { siteConfig } from '@/config/seo';
import { CONTACT_EMAILS } from '@/config/socials';

export const Route = createFileRoute('/_marketing/privacy')({
	component: PrivacyPage,
	head: () => ({
		meta: [
			{ title: `Privacy Policy - ${siteConfig.name}` },
			{
				name: 'description',
				content: 'How Envval collects, uses, and protects your data.',
			},
		],
	}),
});

function PrivacyPage() {
	return (
		<StaticPage title='Privacy Policy' lastUpdated='February 10, 2026'>
			<p>
				Envval is built with privacy in mind. This policy explains what data we collect,
				how we use it, and how we protect it.
			</p>

			<h2>What we collect</h2>
			<p>
				When you create an account, we collect your name and email address. When you use
				the service, we store your encrypted environment variables on our servers to enable
				syncing across devices.
			</p>
			<p>
				We also collect basic usage analytics (page views, feature usage) to understand how
				the product is being used. We do not sell this data to third parties.
			</p>

			<h2>How your data is protected</h2>
			<p>
				Your environment variables are encrypted on your device before they are sent to our
				servers. We cannot read or access the contents of your secrets. The encryption keys
				never leave your device.
			</p>
			<p>
				All data in transit is protected using TLS. Data at rest is encrypted using AES-256.
			</p>

			<h2>Third-party services</h2>
			<p>
				We use the following third-party services to operate Envval:
			</p>
			<ul>
				<li>Authentication provider for secure login</li>
				<li>Cloud hosting for infrastructure</li>
				<li>Analytics for understanding product usage</li>
			</ul>

			<h2>Data retention</h2>
			<p>
				Your data is retained as long as your account is active. If you delete your account,
				all associated data (including encrypted environment variables) is permanently removed
				within 30 days.
			</p>

			<h2>Your rights</h2>
			<p>
				You can request a copy of your data, ask for corrections, or delete your account at
				any time from your dashboard settings. For any privacy-related questions,
				contact <a href={`mailto:${CONTACT_EMAILS.privacy}`}>{CONTACT_EMAILS.privacy}</a>.
			</p>
		</StaticPage>
	)
}
