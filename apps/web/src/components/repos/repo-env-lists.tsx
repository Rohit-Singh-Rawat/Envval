import { FileEditIcon } from 'hugeicons-react';
import { useRepoEnvs, useRepoSummaryBySlug } from '@/hooks/envs/use-repo-envs';
import { EnvFileCard } from './env-file-card';

interface RepoEnvListsProps {
	slug: string;
}

interface Environment {
	id: string;
	fileName: string;
	envCount: number;
	updatedAt: string;
}

export function RepoEnvLists({ slug }: RepoEnvListsProps) {
	const { data: repoSummary } = useRepoSummaryBySlug(slug);

	if (!repoSummary || 'error' in repoSummary) {
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

	if (!repoEnvs || 'error' in repoEnvs) {
		return (
			<div className="w-full">
				<div className="text-destructive">Error loading environments</div>
			</div>
		);
	}

	const environments = (repoEnvs.environments ?? []) as Environment[];

	return (
		<section className="w-full" aria-labelledby="env-list-heading">
			<div className="flex items-center justify-between my-4">
				<h2 id="env-list-heading" className="text-lg font-medium">
					Environment Files
				</h2>
				<span className="text-sm text-muted-foreground">
					{environments.length} file{environments.length !== 1 ? 's' : ''}
				</span>
			</div>

			{environments.length === 0 ? (
				<EmptyState />
			) : (
				<ul className="space-y-3 mb-3" role="list" aria-label="Environment files">
					{environments.map((env: Environment) => (
						<li key={env.id}>
							<EnvFileCard env={env} repoId={repoId} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10">
			<div className="p-3 rounded-full bg-muted/50 mb-3">
				<FileEditIcon className="size-6 text-muted-foreground" aria-hidden="true" />
			</div>
			<p className="font-medium text-foreground">No environment files yet</p>
			<p className="text-sm text-muted-foreground mt-1 max-w-xs">
				Create a .env file in your project and sync it using the VS Code extension
			</p>
		</div>
	);
}
