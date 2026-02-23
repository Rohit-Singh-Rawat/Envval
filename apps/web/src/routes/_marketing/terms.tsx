import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/static/static-page";
import { siteConfig } from "@/config/seo";
import { CONTACT_EMAILS } from "@/config/socials";

export const Route = createFileRoute("/_marketing/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: `Terms of Service - ${siteConfig.name}` },
      {
        name: "description",
        content: "Terms and conditions for using Envval.",
      },
    ],
  }),
});

function TermsPage() {
  return (
    <StaticPage title="Terms of Service" lastUpdated="February 10, 2026">
      <p>
        By using Envval, you agree to these terms. If you do not agree, please
        do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        Envval provides a tool for securely managing and syncing environment
        variables across devices. We offer the service as-is and make no
        guarantees about uptime or availability, though we do our best to keep
        things running smoothly.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for keeping your account credentials secure. You are
        also responsible for all activity that occurs under your account. If you
        suspect unauthorized access, contact us immediately.
      </p>

      <h2>Your data</h2>
      <p>
        You retain ownership of all data you store through Envval, including
        your environment variables. We do not claim any rights to your content.
        We encrypt your data and cannot access the unencrypted contents.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use Envval to store or distribute illegal content, attempt to
        breach our security, or interfere with other users. We reserve the right
        to suspend accounts that violate these guidelines.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Envval is provided without warranty. We are not liable for any damages
        arising from your use of the service, including data loss. You are
        responsible for maintaining your own backups.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. If we make significant
        changes, we will notify you through the service or by email. Continued
        use of Envval after changes constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAILS.support}`}>
          {CONTACT_EMAILS.support}
        </a>
        .
      </p>
    </StaticPage>
  );
}
