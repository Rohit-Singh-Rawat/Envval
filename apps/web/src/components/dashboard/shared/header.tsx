import { UnfoldMoreIcon, Home01Icon, Logout01Icon } from 'hugeicons-react';
import { EnvvalLogo } from '@/components/logo/envval';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
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
import { useUserProfile } from '@/hooks/user/use-user';
import { getAvatarById } from '@/lib/avatars';

const AVATAR_SIZE = 32;

function UserDropdownSkeleton() {
	return (
		<div className='flex items-center gap-3 px-2 py-1.5 h-9 rounded-full bg-muted/20 animate-pulse'>
			<Skeleton className='size-6 rounded-full' />
			<Skeleton className='h-3.5 w-20 rounded-md' />
			<Skeleton className='size-3.5 rounded-sm' />
		</div>
	);
}

function UserDropdown() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const { logout, isLoading } = useLogout();

	// Fetch user profile to get selected avatar
	const { data: profile } = useUserProfile();

	// Priority: 1) user image, 2) selected avatar pattern, 3) localStorage seed
	const avatarSeed = useMemo(() => {
		if (profile?.avatar) {
			// Use the selected avatar pattern
			const avatar = getAvatarById(profile.avatar);
			if (avatar) {
				return `pattern-${avatar.pattern}`;
			}
		}
		// Fallback to localStorage-based seed
		return session?.user ? getOrCreateAvatarSeed(session.user.id, session.user.email) : '';
	}, [profile?.avatar, session?.user]);

	if (isPending) {
		return <UserDropdownSkeleton />;
	}

	const user = {
		name: (profile?.displayName || session?.user?.name) ?? 'User',
		email: session?.user?.email ?? '',
		imageUrl: session?.user?.image ?? null,
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
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
					<UnfoldMoreIcon
						className='size-4 text-muted-foreground'
						aria-hidden='true'
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='end'
				className='w-fit rounded-xl shadow-sm p-1 space-y-2 bg-card'
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className='flex items-center gap-2'>
						<UserAvatar
							name={user.name}
							imageUrl={user.imageUrl}
							avatarSeed={avatarSeed}
							size={AVATAR_SIZE}
						/>
						<div className='flex flex-col text-left'>
							<p className='text-sm font-medium leading-none text-foreground'>{user.name}</p>
							<p className='text-xs text-foreground font-normal mt-1 leading-none truncate max-w-[180px]'>
								{user.email}
							</p>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuGroup className='space-y-1'>
					<DropdownMenuItem onClick={() => navigate({ to: '/home' })}>
						<Home01Icon
							className='size-4'
							aria-hidden='true'
						/>
						<span>Homepage</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						variant='destructive'
						onClick={logout}
						disabled={isLoading}
						className='rounded-b-lg'
					>
						<Logout01Icon
							className='size-4'
							aria-hidden='true'
						/>
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
		<header className='w-full bg-background'>
			<div className='flex items-center justify-between p-4 px-2 md:px-4 w-full max-w-screen-2xl mx-auto'>
				<div className='flex items-center gap-4'>
					<SidebarTrigger className='md:hidden' />
					<EnvvalLogo
						variant='full'
						className='h-6 w-auto'
					/>
				</div>
				<div className='flex items-center gap-4'>
					<UserDropdown />
				</div>
			</div>
		</header>
	);
}
