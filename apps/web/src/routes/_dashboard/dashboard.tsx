import { createFileRoute } from '@tanstack/react-router';
import { Layers01Icon, Key01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@envval/ui/components/tooltip';
import { Heading } from '@/components/dashboard/shared/heading';
import { Suspense, useState } from 'react';
import { EnvvalLoader } from '@/components/logo/envval';
import { useGetRepos } from '@/hooks/repos/use-get-repos';
import {
	GetStartedWizard,
	shouldShowGetStartedWizard,
} from '@/components/onboarding/get-started-wizard';
import { logMessage } from '@/lib/utils';

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

const ProjectItem = ({
	project,
}: {
	project: {
		name: string | null;
		gitRemoteUrl: string | null;
		workspacePath: string | null;
		environments: number;
		lastSyncedAt: string | null;
		createdAt: string;
		updatedAt: string;
	};
}) => {
	return (
		<li className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors'>
			<div className='flex flex-col gap-1'>
				<span className='font-medium'>{project.name}</span>
				<span className='text-sm text-muted-foreground'>{project.gitRemoteUrl}</span>
			</div>
			<div className='flex items-center gap-4 text-sm text-muted-foreground'>
				<Tooltip>
					<TooltipTrigger>
						<span className='flex items-center gap-1'>
							<Layers01Icon className='size-4' />
							{project.environments}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<p>{project.environments} environments</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						<span className='flex items-center gap-1'>
							<Key01Icon className='size-4' />
							{project.lastSyncedAt}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<p>{project.lastSyncedAt} last synced</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</li>
	);
};

const ProjectList = () => {
	logMessage('ProjectList');
	const { data: repos } = useGetRepos();

	logMessage('repos', repos);

	return (
		<>
			<ul className='flex flex-col gap-1'>
				{repos.map((repo) => (
					<ProjectItem
						key={repo.name}
						project={repo}
					/>
				))}
			</ul>
		</>
	);
};
