import type { ComponentType } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
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
import { authClient } from '@/lib/auth-client';

const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type LoginValues = z.infer<typeof loginSchema>;

type AuthFormProps = {
	onSubmit?: (values: LoginValues) => Promise<void> | void;
	mode?: 'login' | 'signup';
	isSubmitting?: boolean;
};

type OAuthProvider = 'google' | 'github';

type OAuthButtonProps = {
	provider: OAuthProvider;
	mode: 'login' | 'signup';
};

const providerConfig: Record<
	OAuthProvider,
	{ icon: ComponentType<{ className?: string }>; label: string }
> = {
	google: { icon: GoogleIcon, label: 'Google' },
	github: { icon: GithubIcon, label: 'GitHub' },
};

function OAuthButton({ provider, mode }: OAuthButtonProps) {
	const { mutate: signIn, isPending } = useMutation({
		mutationFn: async () => {
			await authClient.signIn.social({
				provider,
			});
		},
	});

	const { icon: Icon, label } = providerConfig[provider];

	return (
		<Button
			type='button'
			variant='muted'
			className='w-full'
			pending={isPending}
			onClick={() => signIn()}
			disabled={isPending}
		>
			<Icon
				className='size-5'
				aria-hidden
			/>
			<span className='ml-2'>
				{mode === 'login' ? `Continue with ${label}` : `Sign up with ${label}`}
			</span>
		</Button>
	);
}

function AuthForm({ onSubmit, mode = 'login', isSubmitting }: AuthFormProps) {
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
		},
	});

	return (
		<Form {...form}>
			<form
				className='space-y-4 w-full'
				onSubmit={form.handleSubmit(async (values) => {
					await onSubmit?.(values);
				})}
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
					pending={isSubmitting}
					pendingText='Continuing…'
				>
					{mode === 'login' ? 'Continue with email' : 'Create account with email'}
				</Button>

				<div className='relative text-center text-sm text-muted-foreground'>
					<span className='px-2 bg-background relative z-10'>or</span>
					<div className='absolute inset-x-0 top-1/2 h-px bg-border' />
				</div>

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<OAuthButton
						provider='google'
						mode={mode}
					/>
					<OAuthButton
						provider='github'
						mode={mode}
					/>
				</div>
			</form>
		</Form>
	);
}

export default AuthForm;
