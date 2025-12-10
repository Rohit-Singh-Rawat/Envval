import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GithubIcon } from '@/components/icons/github';
import { GoogleIcon } from '@/components/icons/google';

const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type LoginValues = z.infer<typeof loginSchema>;

type AuthFormProps = {
	onSubmit?: (values: LoginValues) => Promise<void> | void;
	mode?: 'login' | 'signup';
};

function AuthForm({ onSubmit, mode = 'login' }: AuthFormProps) {
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
		},
	});

	async function handleSubmit(values: LoginValues) {
		await onSubmit?.(values);
		// Replace with real auth handler when available.
		console.info('Login submitted', values);
	}

	return (
		<Form {...form}>
			<form
				className='space-y-4 w-full'
				onSubmit={form.handleSubmit(handleSubmit)}
				noValidate
			>
				<FormField
					control={form.control}
					name='email'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									variant='muted'
									placeholder='you@example.com'
									type='email'
									autoComplete='email'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type='submit'
					className='w-full'
					pending={form.formState.isSubmitting}
					pendingText='Continuing…'
				>
					{mode === 'login' ? 'Continue with email' : 'Create account with email'}
				</Button>

				<div className='relative text-center text-sm text-muted-foreground'>
					<span className='px-2 bg-background relative z-10'>or</span>
					<div className='absolute inset-x-0 top-1/2 h-px bg-border' />
				</div>

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<Button
						type='button'
						variant='muted'
						className='w-full '
					>
						<GoogleIcon
							className='size-5'
							aria-hidden
						/>
						<span className='ml-2'>
							{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
						</span>
					</Button>

					<Button
						type='button'
						variant='muted'
						className='w-full'
					>
						<GithubIcon
							className='size-5'
							aria-hidden
						/>
						<span className='ml-2'>
							{mode === 'login' ? 'Continue with GitHub' : 'Sign up with GitHub'}
						</span>
					</Button>
				</div>
			</form>
		</Form>
	);
}

export default AuthForm;
