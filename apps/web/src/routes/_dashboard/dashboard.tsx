import { createFileRoute, Link } from '@tanstack/react-router';
import { Layers01Icon, Clock01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@envval/ui/components/tooltip';
import { Heading } from '@/components/dashboard/shared/heading';
import { Suspense, useState } from 'react';
import { EnvvalLoader } from '@/components/logo/envval';
import { useGetRepos } from '@/hooks/repos/use-get-repos';
import { GetStartedWizard } from '@/components/onboarding/get-started-wizard';

export const Route = createFileRoute('/_dashboard/dashboard')({
	component: RouteComponent,
});

function RouteComponent() {
	return <DashboardContent />;
}

function DashboardContent() {
	const [hideWizard, setHideWizard] = useState(false);

	const showWizard = !hideWizard;

	return (
		<>
			<Heading
				title='Projects'
				description='Manage your projects and their associated data.'
			/>

			{showWizard && (
				<GetStartedWizard
					repos={[]}
					onHide={() => setHideWizard(true)}
				/>
			)}

			<section>
				<Suspense
					fallback={
						<div className='flex items-center justify-center w-full h-[50vh]'>
							<EnvvalLoader className='w-full h-10 rounded-md' />
						</div>
					}
				>
					<ProjectList />
				</Suspense>
			</section>
		</>
	);
}

interface Project {
	id: string;
	name: string;
	slug: string;
	gitRemoteUrl: string | null;
	workspacePath: string | null;
	environments: number;
	lastSyncedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

function formatRelativeTime(dateString: string | null): string {
	if (!dateString) return 'Never';
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

function ProjectItem({ project }: { project: Project }) {
	return (
		<li>
			<Link
				to='/repos/$slug'
				params={{ slug: project.slug }}
				className='flex items-center justify-between p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-all group'
				aria-label={`View ${project.name} project`}
			>
				<div className='flex flex-col gap-1 min-w-0'>
					<span className='font-medium truncate'>{project.name}</span>
					{project.gitRemoteUrl && (
						<span className='text-sm text-muted-foreground truncate'>
							{project.gitRemoteUrl}
						</span>
					)}
				</div>
				<div className='flex items-center gap-4 text-sm text-muted-foreground shrink-0'>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className='flex items-center gap-1.5'>
								<Layers01Icon className='size-4' aria-hidden='true' />
								<span>{project.environments}</span>
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>{project.environments} environment{project.environments !== 1 ? 's' : ''}</p>
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className='flex items-center gap-1.5'>
								<Clock01Icon className='size-4' aria-hidden='true' />
								<span>{formatRelativeTime(project.lastSyncedAt)}</span>
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Last synced: {project.lastSyncedAt ? new Date(project.lastSyncedAt).toLocaleString() : 'Never'}</p>
						</TooltipContent>
					</Tooltip>
					<ArrowRight01Icon
						className='size-4 opacity-0 group-hover:opacity-100 transition-opacity'
						aria-hidden='true'
					/>
				</div>
			</Link>
		</li>
	);
}

function ProjectList() {
	const { data: repos } = useGetRepos();

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
		<ul className='flex flex-col gap-1' role='list' aria-label='Projects list'>
			{repos.map((repo) => (
				<ProjectItem key={repo.id} project={repo as Project} />
			))}
		</ul>
	);
}
