import { FileEditIcon, Clock01Icon } from 'hugeicons-react';
import { useRepoEnvs, useRepoSummaryBySlug } from '@/hooks/envs/use-repo-envs';

interface RepoEnvListsProps {
	slug: string;
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

export function RepoEnvLists({ slug }: RepoEnvListsProps) {
	const { data: repoSummary } = useRepoSummaryBySlug(slug);

	if (!repoSummary || 'error' in repoSummary) {
		return (
			<div className='w-full p-4'>
				<div className='text-destructive'>Error loading repository</div>
			</div>
		);
	}

	return <EnvListContent repoId={repoSummary.id} />;
}

function EnvListContent({ repoId }: { repoId: string }) {
	const { data: repoEnvs } = useRepoEnvs(repoId);

	if (!repoEnvs || 'error' in repoEnvs) {
		return (
			<div className='w-full p-4'>
				<div className='text-destructive'>Error loading environments</div>
			</div>
		);
	}

	const environments = repoEnvs.environments ?? [];

	return (
		<section className='w-full p-4' aria-labelledby='env-list-heading'>
			<h2 id='env-list-heading' className='text-lg font-semibold mb-4'>
				Environment Files
			</h2>

			{environments.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20'>
					<FileEditIcon className='size-8 text-muted-foreground mb-2' aria-hidden='true' />
					<p className='text-muted-foreground'>No environment files yet</p>
					<p className='text-sm text-muted-foreground mt-1'>
						Create a .env file in your project to get started
					</p>
				</div>
			) : (
				<ul className='space-y-2' role='list' aria-label='Environment files'>
					{environments.map((env) => (
						<li
							key={env.id}
							className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'
						>
							<div className='flex items-center gap-3'>
								<FileEditIcon className='size-5 text-muted-foreground' aria-hidden='true' />
								<div className='flex flex-col'>
									<span className='font-medium'>{env.fileName}</span>
									<span className='text-sm text-muted-foreground'>
										{env.envCount} variable{env.envCount !== 1 ? 's' : ''}
									</span>
								</div>
							</div>
							<div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
								<Clock01Icon className='size-4' aria-hidden='true' />
								<span>{formatRelativeTime(env.updatedAt)}</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
