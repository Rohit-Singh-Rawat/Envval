import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/static/static-page";
import { siteConfig } from "@/config/seo";

export const Route = createFileRoute("/_marketing/changelog")({
  component: ChangelogPage,
  head: () => ({
    meta: [
      { title: `Changelog - ${siteConfig.name}` },
      {
        name: "description",
        content:
          "See what is new in Envval. Latest updates, improvements, and fixes.",
      },
    ],
  }),
});

const v1Changes = [
  "Initial release",
  "End-to-end encrypted sync for .env files across devices",
  "VS Code extension with one-click setup",
  "Sneak Peek: hover over any env variable reference in your code to see its value",
  "Command Center dashboard for managing devices and projects",
  "Support for multiple .env file formats (.env.local, .env.development, .env.production)",
  "Automatic conflict resolution for variables edited on multiple devices",
];

function ChangelogPage() {
  return (
    <StaticPage title="Changelog" subtitle="What is new in Envval.">
      <section>
        <h2>v1.0</h2>
        <p className="text-sm text-muted-foreground/50 mb-4">
          February 10, 2026
        </p>
        <ul className="list-none pl-0! space-y-2!">
          {v1Changes.map((change) => (
            <li key={change} className="flex gap-2">
              <span className="text-muted-foreground/60 select-none">*</span>
              <span>{change}</span>
            </li>
          ))}
        </ul>
      </section>
    </StaticPage>
  );
}
