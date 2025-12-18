import { createFileRoute, redirect } from '@tanstack/react-router';
import { Header } from '@/components/dashboard/shared/header';
import { AppSidebar } from '@/components/dashboard/shared/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Layers01Icon, Key01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading } from '@/components/dashboard/shared/heading';
import { Suspense, useState } from 'react';
import { EnvvalLoader } from '@/components/logo/envval';
import { authMiddleware } from '@/middleware/auth';
import { useGetRepos } from '@/hooks/repos/use-get-repos';
import {
	GetStartedWizard,
	shouldShowGetStartedWizard,
} from '@/components/onboarding/get-started-wizard';

export const Route = createFileRoute('/dashboard')({
	component: RouteComponent,
	server: {
		middleware: [authMiddleware],
	},
});

function RouteComponent() {
	return (
		<SidebarProvider className='w-full'>
			<div className='flex flex-col min-h-screen  mx-auto w-full max-w-4xl '>
				<Header />
				<div className='flex flex-1 overflow-hidden w-full pt-10'>
					<AppSidebar />
					<main className='flex flex-1 flex-col gap-4 px-5 overflow-auto'>
						<DashboardContent />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

function DashboardContent() {
	const { data: repos } = useGetRepos();
	const [hideWizard, setHideWizard] = useState(false);

	const showWizard = !hideWizard && shouldShowGetStartedWizard(repos);

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
					<TooltipTrigger asChild>
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
					<TooltipTrigger asChild>
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
	const { data: repos } = useGetRepos();
	
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
