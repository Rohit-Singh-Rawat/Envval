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
import {
	ATTRIBUTION_SOURCE_OPTIONS,
	ATTRIBUTION_MEDIUM_OPTIONS,
} from '@/config/attribution';

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
							value={field.value || undefined}
						>
							<SelectTrigger variant='muted'>
								<SelectValue placeholder='Select where you heard about us' />
							</SelectTrigger>
							<SelectContent>
								{ATTRIBUTION_SOURCE_OPTIONS.map((opt) => (
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
							value={field.value || undefined}
						>
							<SelectTrigger variant='muted'>
								<SelectValue placeholder='Select how you found us' />
							</SelectTrigger>
							<SelectContent>
								{ATTRIBUTION_MEDIUM_OPTIONS.map((opt) => (
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
