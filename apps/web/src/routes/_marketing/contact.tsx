import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/static/static-page";
import { siteConfig } from "@/config/seo";
import { CONTACT_EMAILS, SOCIAL_LINKS } from "@/config/socials";

export const Route = createFileRoute("/_marketing/contact")({
	component: ContactPage,
	head: () => ({
		meta: [
			{ title: `Contact - ${siteConfig.name}` },
			{
				name: "description",
				content: "Get in touch with the Envval team.",
			},
		],
	}),
});

function ContactPage() {
	return (
		<StaticPage title="Contact" subtitle="Get in touch.">
			<p>
				For general questions, bug reports, or feedback, the best way to reach
				me is through email or social media.
			</p>

			<h2>Email</h2>
			<p>
				<a href={`mailto:${CONTACT_EMAILS.support}`}>
					{CONTACT_EMAILS.support}
				</a>
			</p>

			<h2>Social</h2>
			<ul>
				<li>
					<a
						href={SOCIAL_LINKS.twitter}
						target="_blank"
						rel="noopener noreferrer"
					>
						Twitter/X
					</a>
				</li>
				<li>
					<a
						href={SOCIAL_LINKS.github}
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</li>
			</ul>

			<h2>Security issues</h2>
			<p>
				If you discover a security vulnerability, please report it to{" "}
				<a href={`mailto:${CONTACT_EMAILS.security}`}>
					{CONTACT_EMAILS.security}
				</a>
				. Do not open a public issue.
			</p>
		</StaticPage>
	);
}
