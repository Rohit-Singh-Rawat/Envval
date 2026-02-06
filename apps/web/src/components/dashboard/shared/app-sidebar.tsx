import {
	DashboardSquare01Icon,
	Activity01Icon,
	Settings02Icon,
	DeviceAccessIcon,
	Search01Icon,
} from 'hugeicons-react';
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
import { Button } from '@envval/ui/components/button';
import { useLocation } from '@tanstack/react-router';
import { cn } from '@envval/ui/lib/utils';

interface AppSidebarProps {
	className?: string;
}

const menuItems = [
	{
		title: 'Dashboard',
		icon: DashboardSquare01Icon,
		href: '/dashboard',
	},
	{
		title: 'Activity',
		icon: Activity01Icon,
		href: '/dashboard/activity',
	},
	{
		title: 'Devices',
		icon: DeviceAccessIcon,
		href: '/dashboard/devices',
	},
	{
		title: 'Settings',
		icon: Settings02Icon,
		href: '/dashboard/settings',
	},
];

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
					<Button
						variant='ghost'
						size='sm'
						className='h-8 w-full relative gap-2 justify-start px-2 has-[>svg]:px-2 squircle'
						onClick={() => {
							// Handle search
						}}
					>
						<Search01Icon className='size-4' />
						<span className='text-muted-foreground'>Search</span>
						<kbd className='pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
							<span className='text-xs'>⌘</span>K
						</kbd>
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => {
								const isActive = currentPath === item.href;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton >
											<a
												href={item.href}
												className={`flex items-center gap-2 squircle ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
											>
												<item.icon className='size-4 text-inherit' />
												<span>{item.title}</span>
											</a>
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
