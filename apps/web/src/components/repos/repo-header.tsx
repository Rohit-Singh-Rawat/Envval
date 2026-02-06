import { Link } from '@tanstack/react-router';
import { ArrowLeft02Icon, GitBranchIcon } from 'hugeicons-react';
import { useRepoSummaryBySlug } from '@/hooks/envs/use-repo-envs';

interface RepoHeaderProps {
	slug: string;
}

export function RepoHeader({ slug }: RepoHeaderProps) {
	const { data: repoSummary } = useRepoSummaryBySlug(slug);

	if (!repoSummary || 'error' in repoSummary) {
		return (
			<header className='w-full bg-background border-b' role='banner'>
				<div className='flex items-center gap-4 p-4 w-full'>
					<Link
						to='/dashboard'
						className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
						aria-label='Back to projects'
					>
						<ArrowLeft02Icon className='size-4' aria-hidden='true' />
						<span className='text-sm'>Projects</span>
					</Link>
					<div className='text-destructive'>Error loading repository</div>
				</div>
			</header>
		);
	}

	return (
		<header className='w-full bg-background border-b' role='banner'>
			<div className='flex items-center justify-between p-4 w-full'>
				<div className='flex items-center gap-4'>
					<Link
						to='/dashboard'
						className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
						aria-label='Back to projects'
					>
						<ArrowLeft02Icon className='size-4' aria-hidden='true' />
						<span className='sr-only'>Back to</span>
						<span className='text-sm'>Projects</span>
					</Link>
					<div className='h-4 w-px bg-border' aria-hidden='true' />
					<div className='flex flex-col'>
						<h1 className='text-lg font-semibold'>{repoSummary.name}</h1>
						{repoSummary.gitRemoteUrl && (
							<span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
								<GitBranchIcon className='size-3.5' aria-hidden='true' />
								<span className='truncate max-w-[300px]'>{repoSummary.gitRemoteUrl}</span>
							</span>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
