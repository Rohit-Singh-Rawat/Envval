import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@envval/ui/components/sidebar';
import { cn } from '@envval/ui/lib/utils';
import { Link, useLocation } from '@tanstack/react-router';
import { DASHBOARD_NAV_ITEMS } from '@/lib/dashboard-nav';
import { CommandMenuTrigger } from './command-menu';
import { EnvvalLogo } from '@/components/logo/envval';

interface AppSidebarProps {
	className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<Sidebar
			className={cn(
				'bg-background w-48 lg:w-56 shrink-0 h-full max-sm:p-3 max-sm:py-5 flex flex-col justify-center',
				className
			)}
			collapsible='none'
			variant='sidebar'
		>
			<SidebarHeader className='px-3 py-4 p-2 gap-5'>
				<Link
					to='/'
					className='flex items-center gap-2 md:hidden'
				>
					<EnvvalLogo
						variant='full'
						className='max-md:h-8 max-md:w-auto'
					/>
				</Link>
				<CommandMenuTrigger className='w-full justify-start' />
			</SidebarHeader>
			<SidebarContent className='px-2 lg:px-3'>
				<SidebarGroup>
					<SidebarGroupLabel className='text-xs'>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{DASHBOARD_NAV_ITEMS.map((item) => {
								const isActive = currentPath === item.href;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton>
											<Link
												to={item.href}
												className={cn(
													'flex items-center w-full gap-2 text-sm',
													isActive ? 'text-primary' : 'text-muted-foreground'
												)}
											>
												<item.icon className='size-4 text-inherit' />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
