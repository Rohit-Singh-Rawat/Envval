import { createFileRoute, Link } from '@tanstack/react-router';
import { Clock01Icon, Key01Icon, Delete01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@envval/ui/components/tooltip';
import { Heading } from '@/components/dashboard/shared/heading';
import { Suspense, useState } from 'react';
import { EnvvalLoader } from '@/components/logo/envval';
import { GetStartedWizard } from '@/components/onboarding/get-started-wizard';
import { DeleteRepoDialog } from '@/components/repos/delete-repo-dialog';
import { formatRelativeTime } from '@/lib/utils';

import { useGetRepos, type Project } from '@/hooks/repos/use-get-repos';

export const Route = createFileRoute('/_dashboard/dashboard')({
	component: RouteComponent,
});

function RouteComponent() {
	return <DashboardContent />;
}

function DashboardContent() {
	const { data: repos = [] } = useGetRepos();
	const [hideWizard, setHideWizard] = useState(false);

	const showWizard = !hideWizard && repos.length === 0;

	return (
		<>
			<Heading
				title='Projects'
				description='Manage your projects and their associated data.'
			/>

			{showWizard && (
				<GetStartedWizard
					repos={repos}
					onHide={() => setHideWizard(true)}
				/>
			)}

			<section className='mt-2 w-full'>
				<Suspense
					fallback={
						<div className='flex items-center justify-center w-full h-[30vh] md:h-[50vh]'>
							<EnvvalLoader className='w-full max-w-xs' />
						</div>
					}
				>
					<ProjectList repos={repos} />
				</Suspense>
			</section>
		</>
	);
}

type ProjectItemProps = {
	project: Project;
	onDeleteClick: (project: Project) => void;
};

/**
 * Renders a single project item in the dashboard list.
 * Adaptive layout: stacks on mobile, row on desktop.
 */
function ProjectItem({ project, onDeleteClick }: ProjectItemProps) {
	const handleDeleteClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDeleteClick(project);
	};

	return (
		<li>
			<Link
				to='/repos/$slug'
				params={{ slug: project.slug }}
				className='flex flex-col sm:flex-row sm:items-center justify-between p-2 px-4 rounded-lg squircle border border-border/50 hover:bg-muted/50 transition-all group gap-4'
				aria-label={`View ${project.name} project`}
			>
				<div className='flex flex-col gap-1 min-w-0 flex-1'>
					<span className='font-normal text-lg truncate tracking-tight'>{project.name}</span>
					{project.gitRemoteUrl && (
						<span className='text-sm text-muted-foreground truncate max-w-md'>
							{project.gitRemoteUrl}
						</span>
					)}
				</div>
				
				<div className='flex items-center justify-between sm:justify-end gap-6 text-sm text-muted-foreground shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20'>
					<div className='flex items-center gap-6'>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className='flex items-center gap-1.5 cursor-default' tabIndex={0}>
									<Key01Icon className='size-4 text-primary/70' aria-hidden='true' />
									<span className='font-medium'>{project.environments}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{project.environments} environment{project.environments !== 1 ? 's' : ''}</p>
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<div className='flex items-center gap-1.5 cursor-default' tabIndex={0}>
									<Clock01Icon className='size-4 text-muted-foreground/70' aria-hidden='true' />
									<span>{formatRelativeTime(project.lastSyncedAt)}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>Last synced: {project.lastSyncedAt ? new Date(project.lastSyncedAt).toLocaleString() : 'Never'}</p>
							</TooltipContent>
						</Tooltip>
					</div>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type='button'
								onClick={handleDeleteClick}
								className='p-2 -m-2 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 hover:text-destructive transition-all focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50'
								aria-label={`Delete ${project.name} repository`}
							>
								<Delete01Icon className='size-4' aria-hidden='true' />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Delete repository</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</Link>
		</li>
	);
}

function ProjectList({ repos }: { repos: Project[] }) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRepo, setSelectedRepo] = useState<Project | null>(null);

	const handleDeleteClick = (project: Project) => {
		setSelectedRepo(project);
		setDeleteDialogOpen(true);
	};

	if (repos.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<p className='text-muted-foreground'>No projects yet</p>
				<p className='text-sm text-muted-foreground mt-1'>
					Initialize a repository in VS Code to get started
				</p>
			</div>
		);
	}

	return (
		<>
			<ul className='flex flex-col gap-1' role='list' aria-label='Projects list'>
				{repos.map((repo) => (
					<ProjectItem
						key={repo.id}
						project={repo}
						onDeleteClick={handleDeleteClick}
					/>
				))}
			</ul>

			{selectedRepo && (
				<DeleteRepoDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					repo={{ name: selectedRepo.name, slug: selectedRepo.slug }}
				/>
			)}
		</>
	);
}
