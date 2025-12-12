import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import type { OnboardingFormValues } from './types';

export function ProfileStep() {
	const form = useFormContext<OnboardingFormValues>();

	return (
		<div className='space-y-4'>
			<FormField
				control={form.control}
				name='firstName'
				render={({ field }) => (
					<FormItem>
						<FormLabel>First name</FormLabel>
						<FormControl>
							<Input
								variant='muted'
								placeholder='Ada'
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='lastName'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Last name</FormLabel>
						<FormControl>
							<Input
								variant='muted'
								placeholder='Lovelace'
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
