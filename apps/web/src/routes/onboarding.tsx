import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { UserIcon, CompassIcon } from 'hugeicons-react';
import { z } from 'zod';
import { FormProvider } from 'react-hook-form';

import { EnvvalLogo } from '@/components/logo/envval';
import { Button } from '@envval/ui/components/button';
import { OnboardingTransition } from '@/components/onboarding/onboarding-transition';
import { ProfileStep } from '@/components/onboarding/profile-step';
import { AttributionStep } from '@/components/onboarding/attribution-step';
import { StepProgress, type StepConfig } from '@/components/onboarding/step-progress';
import { useOnboarding } from '@/hooks/onboarding/use-onboarding';
import { redirectIfOnboardedGuard, redirectIfOnboardedMiddleware } from '@/middleware/auth';
import { useKeyMaterialSync } from '@/hooks/auth/use-key-material-sync';
import { authClient } from '@/lib/auth-client';
import { playUiSound } from '@/lib/sound';

const searchSchema = z.object({
	redirectUrl: z.string().optional(),
});

export const Route = createFileRoute('/onboarding')({
	component: OnboardingRouteComponent,
	validateSearch: searchSchema,
	server: {
		middleware: [redirectIfOnboardedMiddleware],
	},
	beforeLoad: async () => {
		if (typeof window === 'undefined') return;
		const { data: session } = await authClient.getSession();
		redirectIfOnboardedGuard(session);
	},
});

const STEPS: StepConfig[] = [
	{ id: 1, label: 'Your name', icon: UserIcon },
	{ id: 2, label: 'How did you hear?', icon: CompassIcon },
];

function OnboardingRouteComponent() {
	const { redirectUrl } = Route.useSearch();
	const navigate = useNavigate();

	useKeyMaterialSync();

	const { step, isComplete, form, goNext, goBack, onSubmit, onInvalid, isSubmitting } =
		useOnboarding({ totalSteps: STEPS.length });

	const handleContinueToDashboard = () => {
		navigate({ to: redirectUrl ?? '/dashboard' });
	};

	return (
		<OnboardingTransition
			isComplete={isComplete}
			onContinue={handleContinueToDashboard}
		>
			<div className='w-full max-w-md relative flex flex-col items-center justify-center'>
				<div className='w-screen border-t border-border' />
				<div className='w-full max-w-md p-5'>
					<StepProgress
						steps={STEPS}
						currentStep={step}
						className='pb-40'
					/>
					<div className='min-h-[500px]'>
						<div className='flex flex-col items-center gap-3 pb-10'>
							<EnvvalLogo className='size-12' />
							<div className='text-center'>
								<h1 className='text-2xl font-semibold'>Welcome to Envval</h1>
								<p className='text-sm text-muted-foreground'>
									Just two quick steps to finish setting up your account.
								</p>
							</div>
						</div>
						<FormProvider {...form}>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (step < STEPS.length) {
										void goNext();
										return;
									}
									form.handleSubmit(onSubmit, onInvalid)();
								}}
								className='space-y-6'
							>
								<div>
									{step === 1 && <ProfileStep />}
									{step === 2 && <AttributionStep />}
								</div>

								<div className='flex items-center justify-between pt-2'>
									<button
										type='button'
										onClick={() => {
											playUiSound('button');
											goBack();
										}}
										disabled={step === 1 || isSubmitting}
										className='inline-flex items-center justify-center rounded-md h-8 px-3 gap-1.5 text-sm font-medium bg-muted/80 hover:bg-muted transition-all disabled:pointer-events-none disabled:opacity-50'
									>
										Back
									</button>
									{step < STEPS.length ? (
										<button
											type='button'
											onClick={(ev) => {
												ev.preventDefault();
												ev.stopPropagation();
												playUiSound('button');
												void goNext();
											}}
											disabled={isSubmitting}
											className='inline-flex items-center justify-center rounded-md h-8 px-3 gap-1.5 text-sm font-medium bg-primary text-primary-foreground shadow-button-default hover:shadow-button-hover hover:bg-primary/90 transition-all disabled:pointer-events-none disabled:opacity-50'
										>
											Next
										</button>
									) : (
										<Button
											type='submit'
											onClick={() => playUiSound('button')}
											pending={isSubmitting}
											disabled={isSubmitting}
										>
											Finish
										</Button>
									)}
								</div>
							</form>
						</FormProvider>
					</div>
				</div>
				<div className='w-screen border-b border-border' />
			</div>
		</OnboardingTransition>
	);
}
