import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandFooter,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@envval/ui/components/command';
import { Spinner } from '@envval/ui/components/icons/spinner';
import { Kbd } from '@envval/ui/components/kbd';
import { cn } from '@envval/ui/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { Copy01Icon, FolderOpenIcon, Logout01Icon, Search01Icon } from 'hugeicons-react';
import * as React from 'react';
import { useLogout } from '@/hooks/auth/use-logout';
import { toast } from '@/lib/toast';
import type { Project } from '@/hooks/repos/use-get-repos';
import { useGetRepos } from '@/hooks/repos/use-get-repos';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { DASHBOARD_NAV_ITEMS } from '@/lib/dashboard-nav';

interface CommandMenuTriggerProps {
	className?: string;
}

export function CommandMenuTrigger({ className }: CommandMenuTriggerProps) {
	const { setOpen } = useCommandMenu();

	return (
		<button
			type='button'
			onClick={() => setOpen(true)}
			className={cn(
				'group flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/60 transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary/50 border border-border/40 hover:border-border/80 squircle',
				className
			)}
			aria-label='Open command menu (search, navigate, run actions)'
		>
			<div className='flex items-center gap-2 flex-1'>
				{' '}
				<Search01Icon
					className='size-4 opacity-70 group-hover:opacity-100 transition-opacity'
					aria-hidden
				/>
				<span className='hidden md:inline-flex font-medium'>Search...</span>
			</div>

			<Kbd
				className='hidden md:inline-flex ml-4 group-hover:bg-muted/80 transition-colors border-border/50 '
				aria-hidden
			>
				<span className='text-xs opacity-70'>⌘</span>K
			</Kbd>
		</button>
	);
}

/** Action run on select; menu closes then the action runs. */
function runAndClose(setOpen: (open: boolean) => void, action: () => void) {
	setOpen(false);
	action();
}

function matchesSearch(label: string, searchLower: string): boolean {
	return !searchLower || label.toLowerCase().includes(searchLower);
}

export function CommandMenu() {
	const { open, setOpen } = useCommandMenu();
	const navigate = useNavigate();
	const [search, setSearch] = React.useState('');
	const debouncedSearch = useDebounce(search, 300);
	const { data: repos = [], isLoading: reposLoading } = useGetRepos({
		search: debouncedSearch.trim() || undefined,
	});
	const { logout } = useLogout();

	const copyToClipboard = React.useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	}, []);

	const searchLower = search.trim().toLowerCase();

	const navFiltered = React.useMemo(
		() =>
			DASHBOARD_NAV_ITEMS.filter((item) => matchesSearch(item.title, searchLower)).map((item) => ({
				...item,
				action: () => navigate({ to: item.href }),
			})),
		[searchLower, navigate]
	);

	const generalItems = React.useMemo(
		() =>
			[
				{
					label: 'Copy current URL',
					icon: Copy01Icon,
					action: () => copyToClipboard(window.location.href, 'Current URL'),
					shortcut: '⌘⇧U' as const,
				},
			].filter((item) => matchesSearch(item.label, searchLower)),
		[searchLower, copyToClipboard]
	);

	const systemItems = React.useMemo(
		() =>
			[
				{
					label: 'Logout',
					icon: Logout01Icon,
					action: logout,
					shortcut: '⇧⌘Q' as const,
				},
			].filter((item) => matchesSearch(item.label, searchLower)),
		[searchLower, logout]
	);

	const hasAnyResults =
		navFiltered.length > 0 || repos.length > 0 || generalItems.length > 0 || systemItems.length > 0;

	const showEmpty = search.trim() !== '' && !hasAnyResults;

	// Reset search when dialog closes so next open starts fresh
	React.useEffect(() => {
		if (!open) setSearch('');
	}, [open]);

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title='Command palette'
			description='Search pages, repositories, or run an action.'
		>
			<Command shouldFilter={false}>
				<CommandInput
					placeholder='Type a command or search...'
					value={search}
					onValueChange={setSearch}
					aria-label='Search commands and pages'
				/>
				<CommandList aria-busy={reposLoading}>
					{showEmpty && <CommandEmpty>No results for &quot;{search.trim()}&quot;</CommandEmpty>}

					{!showEmpty && navFiltered.length > 0 && (
						<CommandGroup
							heading='Navigation'
							aria-label='Navigation'
						>
							{navFiltered.map((item) => (
								<CommandItem
									key={item.href}
									value={`nav-${item.href}`}
									onSelect={() => runAndClose(setOpen, item.action)}
								>
									<item.icon
										className='size-4 mr-2 shrink-0'
										aria-hidden
									/>
									<span>{item.title}</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}

					{!showEmpty && (reposLoading || repos.length > 0) && (
						<CommandGroup
							heading='Repositories'
							aria-label='Repositories'
						>
							{reposLoading && repos.length === 0 ? (
								<output
									className='flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground'
									aria-live='polite'
									aria-busy='true'
								>
									<Spinner
										className='size-4 animate-spin shrink-0'
										aria-hidden
									/>
									<span>Loading repositories…</span>
								</output>
							) : (
								repos.map((repo) => (
									<RepoCommandItem
										key={repo.id}
										repo={repo}
										onSelect={() =>
											runAndClose(setOpen, () =>
												navigate({
													to: '/repos/$slug',
													params: { slug: repo.slug },
												})
											)
										}
									/>
								))
							)}
						</CommandGroup>
					)}

					{!showEmpty && generalItems.length > 0 && (
						<CommandGroup
							heading='General'
							aria-label='General actions'
						>
							{generalItems.map((item) => (
								<CommandItem
									key={item.label}
									value={`general-${item.label}`}
									onSelect={() => runAndClose(setOpen, item.action)}
								>
									<item.icon
										className='size-4 mr-2 shrink-0'
										aria-hidden
									/>
									<span>{item.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}

					{!showEmpty && systemItems.length > 0 && (
						<CommandGroup
							heading='System'
							aria-label='System actions'
						>
							{systemItems.map((item) => (
								<CommandItem
									key={item.label}
									value={`system-${item.label}`}
									onSelect={() => runAndClose(setOpen, item.action)}
									className='text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive'
								>
									<item.icon
										className='size-4 mr-2 shrink-0'
										aria-hidden
									/>
									<span>{item.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>

				<CommandFooter>
					<div className='flex items-center gap-1.5'>
						<Kbd>↵</Kbd>
						<span>Go to Page</span>
					</div>
					<div className='ml-auto flex items-center gap-2'>
						<Kbd>⇧⌘Q</Kbd>
						<span>Logout</span>
					</div>
				</CommandFooter>
			</Command>
		</CommandDialog>
	);
}

function RepoCommandItem({ repo, onSelect }: { repo: Project; onSelect: () => void }) {
	return (
		<CommandItem
			value={`${repo.name} ${repo.slug}`}
			onSelect={onSelect}
		>
			<FolderOpenIcon
				className='size-4 mr-2 shrink-0'
				aria-hidden
			/>
			<span className='truncate flex-1'>{repo.name}</span>
			<span
				className='text-muted-foreground text-xs shrink-0'
				title={repo.slug}
			>
				{repo.slug}
			</span>
		</CommandItem>
	);
}
