import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';

import { cn } from '@envval/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			data-slot='accordion'
			className={cn('flex w-full flex-col', className)}
			{...props}
		/>
	);
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot='accordion-item'
			className={cn('not-last:border-b', className)}
			{...props}
		/>
	);
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Header className='flex'>
			<AccordionPrimitive.Trigger
				data-slot='accordion-trigger'
				className={cn(
					'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-lg py-2.5 text-left text-sm font-medium hover:underline focus-visible:ring-3 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-7 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50',
					className
				)}
				{...props}
			>
				{children}

				<HugeiconsIcon
					icon={Add01Icon}
					strokeWidth={1.5}
					data-slot='accordion-trigger-icon'
					className='shrink-0 transition-transform duration-300 ease-out group-aria-expanded/accordion-trigger:rotate-45 text-muted-foreground group-aria-expanded/accordion-trigger:text-primary'
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			data-slot='accordion-content'
			className='text-sm overflow-hidden h-(--accordion-panel-height) transition-[height] duration-300 ease-in-out data-starting-style:h-0 data-ending-style:h-0'
			{...props}
		>
			<div
				className={cn(
					'pt-0 pb-2.5 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4',
					className
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Panel>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
