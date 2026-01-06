import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@envval/ui/components/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@envval/ui/components/select';
import {
	Field,
	FieldLabel,
} from '@envval/ui/components/field';
import type { OnboardingFormValues } from './types';

const SOURCE_OPTIONS = [
	{ value: 'google', label: 'Google Search' },
	{ value: 'twitter', label: 'Twitter / X' },
	{ value: 'linkedin', label: 'LinkedIn' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'producthunt', label: 'Product Hunt' },
	{ value: 'hackernews', label: 'Hacker News' },
	{ value: 'reddit', label: 'Reddit' },
	{ value: 'friend', label: 'Friend / Colleague' },
	{ value: 'blog', label: 'Blog / Article' },
	{ value: 'podcast', label: 'Podcast' },
	{ value: 'other', label: 'Other' },
];

const MEDIUM_OPTIONS = [
	{ value: 'organic', label: 'Organic search' },
	{ value: 'social', label: 'Social media' },
	{ value: 'referral', label: 'Referral' },
	{ value: 'ad', label: 'Advertisement' },
	{ value: 'direct', label: 'Direct link' },
	{ value: 'other', label: 'Other' },
];

export function AttributionStep() {
	const form = useFormContext<OnboardingFormValues>();

	return (
		<div className='space-y-4'>
			<Controller
				name='source'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor='attribution-source'>Where did you hear about us?</FieldLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
						>
							<SelectTrigger variant='muted'>
								<SelectValue>Select where you heard about us</SelectValue>
							</SelectTrigger>
							<SelectContent >
								{SOURCE_OPTIONS.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				)}
			/>

			<Controller
				name='medium'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor='attribution-medium'>How did you find us?</FieldLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
						>
							<SelectTrigger variant='muted'>
								<SelectValue>Select how you found us </SelectValue>
							</SelectTrigger>
							<SelectContent>
								{MEDIUM_OPTIONS.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				)}
			/>

			<Controller
				name='details'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor='attribution-details'>
							Anything else you'd like to share?{' '}
							<span className='text-muted-foreground font-normal'>(optional)</span>
						</FieldLabel>
						<Input
							{...field}
							id='attribution-details'
							variant='muted'
							placeholder='e.g., specific blog post, tweet, etc.'
							aria-invalid={fieldState.invalid}
						/>
					</Field>
				)}
			/>
		</div>
	);
}
