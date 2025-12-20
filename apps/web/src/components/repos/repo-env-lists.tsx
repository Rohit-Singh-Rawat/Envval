import { useRepoEnvs } from '@/hooks/envs/use-repo-envs';

export function RepoEnvLists({ repoId }: { repoId: string }) {
	const { data: repoEnvs } = useRepoEnvs(repoId);
	if (!repoEnvs || 'error' in repoEnvs) {
		return <div>Error loading environments</div>;
	}
	return (
		<div className='w-full'>
			<div className='p-4'>
				<h2 className='text-lg font-semibold mb-4'>Environments</h2>
				<ul className='space-y-2'>
					{repoEnvs.environments?.map((env) => (
						<li
							key={env.id}
							className='p-3 border rounded-md'
						>
							<span className='font-medium'>{env.fileName}</span>
						</li>
					)) ?? <li className='text-muted-foreground'>No environments found</li>}
				</ul>
			</div>
		</div>
	);
}
