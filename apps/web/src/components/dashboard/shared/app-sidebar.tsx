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

interface AppSidebarProps {
	className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<Sidebar
			className={cn('bg-background w-56 shrink-0 h-full flex flex-col justify-center', className)}
			collapsible='none'
			variant='sidebar'
		>
			<SidebarHeader className='p-2 pb-2'>
				<div className='flex items-center justify-between gap-2'>
					<CommandMenuTrigger className='w-full justify-start' />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{DASHBOARD_NAV_ITEMS.map((item) => {
								const isActive = currentPath === item.href;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton>
											<Link
												to={item.href}
												className={`flex items-center w-full gap-2  ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
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
