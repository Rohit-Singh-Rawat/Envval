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
import { useSession } from '@/lib/auth-client';
import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLogout } from '@/hooks/auth/use-logout';
import { Spinner } from '@/components/icons/spinner';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getOrCreateAvatarSeed } from '@/lib/avatar-utils';

const AVATAR_SIZE = 32;

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
	const { logout, isLoading } = useLogout();

	const avatarSeed = session?.user 
		? getOrCreateAvatarSeed(session.user.id, session.user.email)
		: '';

	if (isPending) {
		return <UserDropdownSkeleton />;
	}

	const user = {
		name: session?.user?.name ?? 'User',
		email: session?.user?.email ?? '',
		imageUrl: session?.user?.image ?? null,
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger >
				<Button
					variant='ghost'
					className='flex items-center hover:bg-muted/50 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary/50 px-2 has-[>svg]:px-2'
					aria-label='User menu'
				>
					<UserAvatar
						name={user.name}
						imageUrl={user.imageUrl}
						avatarSeed={avatarSeed}
						size={AVATAR_SIZE}
					/>
					<span className='text-sm font-medium'>{user.name}</span>
					<UnfoldMoreIcon className='size-4 text-muted-foreground' aria-hidden='true' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-64 rounded-2xl shadow-sm p-3'>
				<DropdownMenuGroup>
					<DropdownMenuLabel className='flex items-center gap-2'>
						<UserAvatar
							name={user.name}
							imageUrl={user.imageUrl}
							avatarSeed={avatarSeed}
							size={AVATAR_SIZE}
						/>
						<div className='flex flex-col'>
							<p className='text-sm font-medium'>{user.name}</p>
							<p className='text-xs text-muted-foreground font-normal'>{user.email}</p>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Settings02Icon className='size-4' aria-hidden='true' />
						<span>Account Settings</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate({ to: '/' })}>
						<Home01Icon className='size-4' aria-hidden='true' />
						<span>Homepage</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem variant='destructive' onClick={logout} disabled={isLoading}>
						<Logout01Icon className='size-4' aria-hidden='true' />
						<span>Logout</span>
						{isLoading && <Spinner className='size-4' />}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

import { SidebarTrigger } from '@envval/ui/components/sidebar';

export function Header() {
	return (
		<header className='w-full bg-background '>
			<div className='flex items-center justify-between p-4 px-6 w-full max-w-screen-2xl mx-auto'>
				<div className='flex items-center gap-4'>
					<SidebarTrigger className='md:hidden' />
					<EnvvalLogo variant='full' className='h-6 w-auto' />
				</div>
				<UserDropdown />
			</div>
		</header>
	);
}
