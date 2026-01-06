import { UnfoldMoreIcon, Settings02Icon, Home01Icon, Logout01Icon } from 'hugeicons-react';
import { EnvvalLogo } from '@/components/logo/envval';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@envval/ui/components/dropdown-menu';
import { Button } from '@envval/ui/components/button';
import { Skeleton } from '@envval/ui/components/skeleton';
import { authClient, useSession } from '@/lib/auth-client';
import { useMemo } from 'react';
import { generateRandomGradient } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { useLogout } from '@/hooks/auth/use-logout';
import { Spinner } from '@/components/icons/spinner';

function UserDropdownSkeleton() {
	return (
		<div className='flex items-center gap-2 px-2 py-1'>
			<Skeleton className='size-6 rounded-full' />
			<Skeleton className='h-4 w-20' />
			<Skeleton className='size-4' />
		</div>
	);
}

function UserDropdown() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const gradient = useRandomGradient();
	const { logout, isLoading } = useLogout();
	if (isPending) {
		return <UserDropdownSkeleton />;
	}

	const user = {
		name: session?.user?.name || 'John Doe',
		email: session?.user?.email || 'john@example.com',
		avatarUrl: session?.user?.image || undefined,
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant='ghost'
					className='flex items-center  round  hover:bg-muted/50 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary/50 px-2 has-[>svg]:px-2'
				>
					{user.avatarUrl ? (
						<img
							src={user.avatarUrl}
							alt={user.name}
							className='size-6 rounded-full object-cover'
						/>
					) : (
						<div
							className='size-6 rounded-full flex items-center justify-center'
							style={{ background: gradient }}
						/>
					)}
					<span className='text-sm font-medium'>{user.name}</span>
					<UnfoldMoreIcon className='size-4 text-muted-foreground' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='end'
				className='w-64  rounded-2xl shadow-sm p-3'
			>
				{/* User info */}
				<DropdownMenuGroup>
					<DropdownMenuLabel className='flex items-center gap-2'>
						{user.avatarUrl ? (
							<img
								src={user.avatarUrl}
								alt={user.name}
								className='size-6 rounded-full object-cover'
							/>
						) : (
							<div
								className='size-6 rounded-full flex items-center justify-center'
								style={{ background: gradient }}
							/>
						)}
						<div className='flex flex-col'>
							<p className='text-sm font-medium'>{user.name}</p>
							<p className='text-xs text-muted-foreground font-normal'>{user.email}</p>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />

				{/* Menu items */}
				<DropdownMenuGroup>
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
							navigate({ to: '/' });
						}}
					>
						<Home01Icon className='size-4' />
						<span>Homepage</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>

				{/* Logout */}
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant='destructive'
						onClick={async () => {
							await logout();
						}}
					>
						<Logout01Icon className='size-4' />
						<span>Logout</span>
						{isLoading && <Spinner className='size-4' />}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const useRandomGradient = () => {
	return useMemo(() => generateRandomGradient(), []);
};

export function Header() {
	return (
		<header className='w-full bg-background'>
			<div className='flex items-center justify-between p-4 w-full'>
				<EnvvalLogo
					variant='full'
					className='h-6 w-auto'
				/>

				{/* Right side - User menu */}
				<UserDropdown />
			</div>
		</header>
	);
}
