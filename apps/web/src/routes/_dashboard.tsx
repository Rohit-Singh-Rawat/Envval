import { createFileRoute, Outlet } from '@tanstack/react-router';
import { authMiddleware } from '@/middleware/auth';
import { SidebarProvider } from '@envval/ui/components/sidebar';
import { Header } from '@/components/dashboard/shared/header';
import { AppSidebar } from '@/components/dashboard/shared/app-sidebar';
import { useKeyMaterialSync } from '@/hooks/auth/use-key-material-sync';

export const Route = createFileRoute('/_dashboard')({
	server: {
		middleware: [authMiddleware],
	},
	ssr: false,
	component: RouteComponent,
});

function RouteComponent() {
	// Auto-fetch key material if not already present (e.g., after OAuth redirect)
	useKeyMaterialSync();

	return (
		<SidebarProvider className='w-full'>
			<div className='flex flex-col min-h-screen w-full max-w-4xl mx-auto'>
				<Header />
				<div className='flex flex-1 w-full max-w-screen-2x pt-5 md:pt-10 mx-auto'>
					<AppSidebar className='hidden md:flex' />
					<main className='flex-1 flex flex-col gap-6 px-2 md:px-4 overflow-y-auto'>
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
