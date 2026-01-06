'use client';

import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

import { cn } from '@envval/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

function DropdownMenu({ ...props }: Menu.Root.Props) {
	return (
		<Menu.Root
			data-slot='dropdown-menu'
			{...props}
		/>
	);
}

function DropdownMenuPortal({ ...props }: Menu.Portal.Props) {
	return (
		<Menu.Portal
			data-slot='dropdown-menu-portal'
			{...props}
		/>
	);
}

function DropdownMenuTrigger({ ...props }: Menu.Trigger.Props) {
	return (
		<Menu.Trigger
			data-slot='dropdown-menu-trigger'
			{...props}
		/>
	);
}

function DropdownMenuContent({
	align = 'start',
	alignOffset = 0,
	side = 'bottom',
	sideOffset = 4,
	className,
	...props
}: Menu.Popup.Props &
	Pick<Menu.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
	return (
		<Menu.Portal>
			<Menu.Positioner
				className='isolate z-50 outline-none'
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
			>
				<Menu.Popup
					data-slot='dropdown-menu-content'
					className={cn(
						'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 bg-popover text-popover-foreground min-w-48 rounded-2xl p-1 shadow-2xl ring-1 duration-100 dark z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden',
						className
					)}
					{...props}
				/>
			</Menu.Positioner>
		</Menu.Portal>
	);
}

function DropdownMenuGroup({ ...props }: Menu.Group.Props) {
	return (
		<Menu.Group
			data-slot='dropdown-menu-group'
			{...props}
		/>
	);
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: Menu.GroupLabel.Props & {
	inset?: boolean;
}) {
	return (
		<Menu.GroupLabel
			data-slot='dropdown-menu-label'
			data-inset={inset}
			className={cn('text-muted-foreground px-3 py-2.5 text-xs data-[inset]:pl-8', className)}
			{...props}
		/>
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = 'default',
	...props
}: Menu.Item.Props & {
	inset?: boolean;
	variant?: 'default' | 'destructive';
}) {
	return (
		<Menu.Item
			data-slot='dropdown-menu-item'
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2.5 rounded-xl px-3 py-2 text-sm [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			{...props}
		/>
	);
}

function DropdownMenuSub({ ...props }: Menu.SubmenuRoot.Props) {
	return (
		<Menu.SubmenuRoot
			data-slot='dropdown-menu-sub'
			{...props}
		/>
	);
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: Menu.SubmenuTrigger.Props & {
	inset?: boolean;
}) {
	return (
		<Menu.SubmenuTrigger
			data-slot='dropdown-menu-sub-trigger'
			data-inset={inset}
			className={cn(
				"focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2 rounded-xl px-3 py-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex cursor-default items-center outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			{...props}
		>
			{children}
			<HugeiconsIcon
				icon={ArrowRight01Icon}
				strokeWidth={2}
				className='ml-auto'
			/>
		</Menu.SubmenuTrigger>
	);
}

function DropdownMenuSubContent({
	align = 'start',
	alignOffset = -3,
	side = 'right',
	sideOffset = 0,
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
	return (
		<DropdownMenuContent
			data-slot='dropdown-menu-sub-content'
			className={cn(
				'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 bg-popover text-popover-foreground min-w-36 rounded-2xl p-1 shadow-2xl ring-1 duration-100 w-auto',
				className
			)}
			align={align}
			alignOffset={alignOffset}
			side={side}
			sideOffset={sideOffset}
			{...props}
		/>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: Menu.CheckboxItem.Props) {
	return (
		<Menu.CheckboxItem
			data-slot='dropdown-menu-checkbox-item'
			className={cn(
				"focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			checked={checked}
			{...props}
		>
			<span
				className='pointer-events-none absolute right-2 flex items-center justify-center pointer-events-none'
				data-slot='dropdown-menu-checkbox-item-indicator'
			>
				<Menu.CheckboxItemIndicator>
					<HugeiconsIcon
						icon={Tick02Icon}
						strokeWidth={2}
					/>
				</Menu.CheckboxItemIndicator>
			</span>
			{children}
		</Menu.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({ ...props }: Menu.RadioGroup.Props) {
	return (
		<Menu.RadioGroup
			data-slot='dropdown-menu-radio-group'
			{...props}
		/>
	);
}

function DropdownMenuRadioItem({ className, children, ...props }: Menu.RadioItem.Props) {
	return (
		<Menu.RadioItem
			data-slot='dropdown-menu-radio-item'
			className={cn(
				"focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			{...props}
		>
			<span
				className='pointer-events-none absolute right-2 flex items-center justify-center pointer-events-none'
				data-slot='dropdown-menu-radio-item-indicator'
			>
				<Menu.RadioItemIndicator>
					<HugeiconsIcon
						icon={Tick02Icon}
						strokeWidth={2}
					/>
				</Menu.RadioItemIndicator>
			</span>
			{children}
		</Menu.RadioItem>
	);
}

function DropdownMenuSeparator({ className, ...props }: Menu.Separator.Props) {
	return (
		<Menu.Separator
			data-slot='dropdown-menu-separator'
			className={cn('bg-border/50 -mx-1 my-1 h-px', className)}
			{...props}
		/>
	);
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot='dropdown-menu-shortcut'
			className={cn(
				'text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest',
				className
			)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
