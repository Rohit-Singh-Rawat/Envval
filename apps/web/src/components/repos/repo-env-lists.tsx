import { useRepoEnvs, useRepoSummaryBySlug } from "@/hooks/envs/use-repo-envs";
import { EmptyEnvsState } from "./empty-envs-state";
import { EnvFileCard } from "./env-file-card";
import type { Environment } from "./types";

interface RepoEnvListsProps {
  slug: string;
}

export function RepoEnvLists({ slug }: RepoEnvListsProps) {
  const { data: repoSummary } = useRepoSummaryBySlug(slug);

  if (!repoSummary || "error" in repoSummary) {
    return (
      <div className="w-full p-4">
        <div className="text-destructive">Error loading repository</div>
      </div>
    );
  }

  return <EnvListContent repoId={repoSummary.id} />;
}

function EnvListContent({ repoId }: { repoId: string }) {
  const { data: repoEnvs } = useRepoEnvs(repoId, true);

  if (!repoEnvs || "error" in repoEnvs) {
    return (
      <div className="w-full">
        <div className="text-destructive">Error loading environments</div>
      </div>
    );
  }

  const environments = (repoEnvs.environments ?? []) as Environment[];

  return (
    <section className="w-full" aria-labelledby="env-list-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="env-list-heading" className="text-lg font-medium">
          Environment Files
        </h2>
        <span className="text-sm text-muted-foreground">
          {environments.length} file{environments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {environments.length === 0 ? (
        <EmptyEnvsState />
      ) : (
        <ul
          className="space-y-3 mb-3"
          role="list"
          aria-label="Environment files"
        >
          {environments.map((env) => (
            <li key={env.id}>
              <EnvFileCard env={env} repoId={repoId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
