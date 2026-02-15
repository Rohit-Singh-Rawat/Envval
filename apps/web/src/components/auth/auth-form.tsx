import type { ComponentType } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@envval/ui/components/button';
import { Input } from '@envval/ui/components/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@envval/ui/components/field';
import { GithubIcon } from '@/components/icons/github';
import { GoogleIcon } from '@/components/icons/google';
import { authClient } from '@/lib/auth-client';
import { env } from '@/env';

const loginSchema = z.object({
	email: z.email('Enter a valid email'),
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
	const webOrigin = typeof window !== 'undefined' ? window.location.origin : env.VITE_APP_URL;
	const { mutate: signIn, isPending } = useMutation({
		mutationFn: async () => {
			// Absolute callback URLs so redirect goes to web app, not API (split frontend/backend)
			await authClient.signIn.social({
				provider,
				callbackURL: `${webOrigin}/dashboard`,
				newUserCallbackURL: `${webOrigin}/onboarding`,
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
		<form
			id='auth-form'
			className='space-y-4 w-full'
			onSubmit={form.handleSubmit(async (values) => {
				await onSubmit?.(values);
			})}
			noValidate
		>
			<FieldGroup>
				<Controller
					name='email'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='auth-form-email'>Email</FieldLabel>
							<Input
								{...field}
								id='auth-form-email'
								variant='muted'
								placeholder='you@example.com'
								type='email'
								autoComplete='email'
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</FieldGroup>

			<Button
				type='submit'
				className='w-full'
				pending={isSubmitting}
				pendingText={mode === 'login' ? 'logging in…' : 'creating account…'}
			>
				{mode === 'login' ? 'Continue with email' : 'Create account with email'}
			</Button>

			<div className='relative text-center text-sm text-muted-foreground'>
				<span className='px-2 bg-background relative z-10'>or</span>
				<div className='absolute inset-x-0 top-1/2 h-px bg-border' />
			</div>

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-hidden'>
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
	);
}

export default AuthForm;
