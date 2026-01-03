import { createFileRoute, Outlet } from '@tanstack/react-router';
import { authMiddleware } from '@/middleware/auth';
import { SidebarProvider } from '@envval/ui/components/sidebar';
import { Header } from '@/components/dashboard/shared/header';
import { AppSidebar } from '@/components/dashboard/shared/app-sidebar';

export const Route = createFileRoute('/_dashboard')({
	server: {
		middleware: [authMiddleware],
	},
	component: RouteComponent,
});
function RouteComponent() {
	return (
		<SidebarProvider className='w-full'>
			<div className='flex flex-col min-h-screen  mx-auto w-full max-w-4xl '>
				<Header />
				<div className='flex flex-1 overflow-hidden w-full pt-10'>
					<AppSidebar />
					<main className='flex flex-1 flex-col gap-4 px-5 overflow-auto'>
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
