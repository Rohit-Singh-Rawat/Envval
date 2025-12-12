import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
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
			<FormField
				control={form.control}
				name='source'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Where did you hear about us?</FormLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger variant='muted'>
									<SelectValue placeholder='Select a source' />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
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
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name='medium'
				render={({ field }) => (
					<FormItem>
						<FormLabel>How did you find us?</FormLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger variant='muted'>
									<SelectValue placeholder='Select how you found us' />
								</SelectTrigger>
							</FormControl>
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
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name='details'
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							Anything else you'd like to share?{' '}
							<span className='text-muted-foreground font-normal'>(optional)</span>
						</FormLabel>
						<FormControl>
							<Input
								variant='muted'
								placeholder='e.g., specific blog post, tweet, etc.'
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
