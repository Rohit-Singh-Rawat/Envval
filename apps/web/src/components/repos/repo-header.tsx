import { useRepoSummary } from '@/hooks/envs/use-repo-envs';

export function RepoHeader({ repoId }: { repoId: string }) {
	const { data: repoSummary } = useRepoSummary(repoId);
	if (!repoSummary || 'error' in repoSummary) {
		return <div>Error loading repository</div>;
	}

	return (
		<header className='w-full bg-background'>
			<div className='flex items-center justify-between p-4 w-full'>
				<div className='flex flex-col'>
					<h1 className='text-lg font-semibold'>{repoSummary.name}</h1>
				</div>
			</div>
		</header>
	);
}
