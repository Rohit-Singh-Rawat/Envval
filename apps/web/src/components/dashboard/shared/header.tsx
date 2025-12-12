import { UnfoldMoreIcon, Settings02Icon, Home01Icon, Logout01Icon } from 'hugeicons-react';
import { EnvvalLogo } from '@/components/logo/envval';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface HeaderProps {
	user?: {
		name: string;
		email: string;
		avatarUrl?: string;
	};
}

export function Header({ user }: HeaderProps) {
	const defaultUser = {
		name: user?.name || 'John Doe',
		email: user?.email || 'john@example.com',
		avatarUrl: user?.avatarUrl,
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<header className='w-full bg-background'>
			<div className='flex items-center justify-between p-4 w-full'>
				<EnvvalLogo
					variant='full'
					className='h-6 w-auto'
				/>

				{/* Right side - User menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							className='flex items-center  round  hover:bg-muted/50 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary/50 px-2 has-[>svg]:px-2'
						>
							{defaultUser.avatarUrl ? (
								<img
									src={defaultUser.avatarUrl}
									alt={defaultUser.name}
									className='size-6 rounded-full object-cover'
								/>
							) : (
								<div className='size-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium '>
									{getInitials(defaultUser.name)}
								</div>
							)}
							<span className='text-sm font-medium'>{defaultUser.name}</span>
							<UnfoldMoreIcon className='size-4 text-muted-foreground' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='w-64  rounded-2xl shadow-sm p-3'
					>
						{/* User info */}
						<DropdownMenuLabel>
							<div className='flex flex-col'>
								<p className='text-sm font-medium'>{defaultUser.name}</p>
								<p className='text-xs text-muted-foreground font-normal'>{defaultUser.email}</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{/* Menu items */}
						<DropdownMenuItem
							onClick={() => {
								// Handle account settings
							}}
						>
							<Settings02Icon className='size-4' />
							<span>Account Settings</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								// Handle homepage navigation
							}}
						>
							<Home01Icon className='size-4' />
							<span>Homepage</span>
						</DropdownMenuItem>

						{/* Logout */}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant='destructive'
							onClick={() => {
								// Handle logout
							}}
						>
							<Logout01Icon className='size-4' />
							<span>Logout</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
