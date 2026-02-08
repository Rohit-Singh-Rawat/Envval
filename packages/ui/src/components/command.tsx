'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import { cn } from '@envval/ui/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@envval/ui/components/dialog';
import { InputGroup, InputGroupAddon } from '@envval/ui/components/input-group';
import { HugeiconsIcon } from '@hugeicons/react';
import { SearchIcon, Tick02Icon } from '@hugeicons/core-free-icons';

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot='command'
			className={cn(
				'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-[22px] ',
				className
			)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = 'Command Palette',
	description = 'Search for a command to run...',
	children,
	className,
	showCloseButton = false,
	...props
}: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className='sr-only'>
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn(
					'max-w-lg rounded-3xl border-4 border-black/10 bg-popover p-0 shadow-sm top-[20%] translate-y-0 duration-200',
					'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95',
					className
				)}
				showCloseButton={showCloseButton}
			>
				{children}
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			data-slot='command-input-wrapper'
			className='p-2'
		>
			<InputGroup className='border-input bg-input/30 h-10 rounded-lg shadow-none *:data-[slot=input-group-addon]:pl-2.5'>
				<CommandPrimitive.Input
					data-slot='command-input'
					className={cn(
						'w-full text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
					{...props}
				/>
				<InputGroupAddon>
					<HugeiconsIcon
						icon={SearchIcon}
						strokeWidth={2}
						className='size-4 shrink-0 text-muted-foreground'
					/>
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot='command-list'
			className={cn(
				'no-scrollbar max-h-[min(20rem,70vh)] scroll-py-1 overflow-x-hidden overflow-y-auto outline-none px-1.5 pb-2',
				className
			)}
			{...props}
		/>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot='command-empty'
			className={cn('py-8 text-center text-sm text-muted-foreground', className)}
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot='command-group'
			className={cn(
				'text-foreground overflow-hidden  py-1 first:pt-0',
				'**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
				className
			)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot='command-separator'
			className={cn('bg-border -mx-0.5 my-1 h-px', className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot='command-item'
			className={cn(
				'data-[selected=true]:bg-muted/40 data-[selected=true]:border-border/60 border-transparent border data-[selected=true]:border data-[selected=true]:text-accent-foreground data-[selected=true]:*:[svg]:text-accent-foreground',
				'relative flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-hidden select-none',
				"[&_svg:not([class*='size-'])]:size-4 group/command-item",
				'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
				className
			)}
			{...props}
		>
			{children}
			<HugeiconsIcon
				icon={Tick02Icon}
				strokeWidth={2}
				className='ml-auto size-4 opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100 text-accent-foreground transition-opacity'
			/>
		</CommandPrimitive.Item>
	);
}

function CommandFooter({ className, ref, children, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			ref={ref}
			data-slot='command-footer'
			className={cn(
				'flex items-center gap-3 border-t bg-input/30 border-border px-3 py-2 text-xs text-muted-foreground',
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot='command-shortcut'
			className={cn(
				'text-muted-foreground group-data-[selected=true]/command-item:text-accent-foreground ml-auto text-xs tracking-wider tabular-nums',
				className
			)}
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandFooter,
	CommandShortcut,
	CommandSeparator,
};
