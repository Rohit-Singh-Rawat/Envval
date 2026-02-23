import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/static/static-page";
import { siteConfig } from "@/config/seo";
import { CONTACT_EMAILS } from "@/config/socials";

export const Route = createFileRoute("/_marketing/cookie-policy")({
	component: CookiePolicyPage,
	head: () => ({
		meta: [
			{ title: `Cookie Policy - ${siteConfig.name}` },
			{
				name: "description",
				content: "How Envval uses cookies.",
			},
		],
	}),
});

function CookiePolicyPage() {
	return (
		<StaticPage title="Cookie Policy" lastUpdated="February 10, 2026">
			<p>
				This policy explains how Envval uses cookies and similar technologies.
			</p>

			<h2>What are cookies</h2>
			<p>
				Cookies are small text files stored on your device when you visit a
				website. They help the site remember your preferences and understand how
				you use it.
			</p>

			<h2>Cookies we use</h2>

			<h3>Essential cookies</h3>
			<p>
				These are required for the service to function. They handle
				authentication, session management, and security. You cannot opt out of
				these cookies while using Envval.
			</p>

			<h3>Analytics cookies</h3>
			<p>
				We use analytics to understand how people use Envval so we can improve
				the product. These cookies collect anonymous usage data like page views
				and feature interactions.
			</p>

			<h2>Managing cookies</h2>
			<p>
				You can control cookies through your browser settings. Most browsers
				allow you to block or delete cookies. Keep in mind that blocking
				essential cookies will prevent you from using Envval.
			</p>

			<h2>Questions</h2>
			<p>
				If you have questions about our use of cookies, contact us at{" "}
				<a href={`mailto:${CONTACT_EMAILS.support}`}>
					{CONTACT_EMAILS.support}
				</a>
				.
			</p>
		</StaticPage>
	);
}
