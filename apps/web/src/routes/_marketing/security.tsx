import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/static/static-page";
import { siteConfig } from "@/config/seo";
import { CONTACT_EMAILS } from "@/config/socials";

export const Route = createFileRoute("/_marketing/security")({
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: `Security - ${siteConfig.name}` },
      {
        name: "description",
        content: "How Envval keeps your secrets safe.",
      },
    ],
  }),
});

function SecurityPage() {
  return (
    <StaticPage title="Security" subtitle="How we protect your data.">
      <p>
        Security is not a feature for us. It is the foundation. Envval exists to
        keep your secrets safe, and we take that responsibility seriously.
      </p>

      <h2>End-to-end encryption</h2>
      <p>
        Your environment variables are encrypted on your device before they
        leave it. The encryption keys are derived locally and never transmitted
        to our servers. This means we cannot read your secrets, even if we
        wanted to.
      </p>

      <h2>Data in transit</h2>
      <p>
        All communication between your device and our servers uses TLS 1.2 or
        higher. API requests are authenticated using secure tokens that are
        rotated regularly.
      </p>

      <h2>Data at rest</h2>
      <p>
        Encrypted data stored on our servers is further protected with AES-256
        encryption at the infrastructure level. Database access is restricted
        and audited.
      </p>

      <h2>Infrastructure</h2>
      <p>
        Our servers run on trusted cloud infrastructure with regular security
        patches and updates. We follow the principle of least privilege for all
        system access.
      </p>

      <h2>Reporting vulnerabilities</h2>
      <p>
        If you discover a security vulnerability in Envval, please report it to{" "}
        <a href={`mailto:${CONTACT_EMAILS.security}`}>
          {CONTACT_EMAILS.security}
        </a>
        . We appreciate responsible disclosure and will respond within 48 hours.
      </p>
      <p>Please do not open public issues for security vulnerabilities.</p>
    </StaticPage>
  );
}
