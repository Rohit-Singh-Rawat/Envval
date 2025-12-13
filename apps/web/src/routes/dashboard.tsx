import { createFileRoute, redirect } from '@tanstack/react-router';
import { Header } from '@/components/dashboard/shared/header';
import { AppSidebar } from '@/components/dashboard/shared/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Layers01Icon, Key01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading } from '@/components/dashboard/shared/heading';
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { EnvvalLoader } from '@/components/logo/envval';
import { authMiddleware } from '@/middleware/auth';

const getProjects = async () => {
	await new Promise((resolve) => setTimeout(resolve, 3000));
	return [
		{
			name: 'Project Alpha',
			description: 'Main production application',
			envs: 3,
			secrets: 12,
		},
		{
			name: 'Project Beta',
			description: 'Testing environment for new features',
			envs: 2,
			secrets: 8,
		},
		{
			name: 'Project Gamma',
			description: 'Internal tools and utilities',
			envs: 1,
			secrets: 5,
		},
		{
			name: 'Project Delta',
			description: 'Client-facing API services',
			envs: 4,
			secrets: 15,
		},
	];
};

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
						<Heading
							title='Projects'
							description='Manage your projects and their associated data.'
						/>
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
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

const ProjectItem = ({
	project,
}: {
	project: { name: string; description: string; envs: number; secrets: number };
}) => {
	return (
		<li className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors'>
			<div className='flex flex-col gap-1'>
				<span className='font-medium'>{project.name}</span>
				<span className='text-sm text-muted-foreground'>{project.description}</span>
			</div>
			<div className='flex items-center gap-4 text-sm text-muted-foreground'>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className='flex items-center gap-1'>
							<Layers01Icon className='size-4' />
							{project.envs}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<p>{project.envs} environments</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className='flex items-center gap-1'>
							<Key01Icon className='size-4' />
							{project.secrets}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<p>{project.secrets} secrets</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</li>
	);
};

const ProjectList = () => {
	const { data: projects } = useSuspenseQuery({
		queryKey: ['projects'],
		queryFn: getProjects,
	});
	return (
		<>
			<ul className='flex flex-col gap-1'>
				{projects?.map((project) => (
					<ProjectItem
						key={project.name}
						project={project}
					/>
				))}
			</ul>
		</>
	);
};
