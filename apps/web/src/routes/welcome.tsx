import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { UserIcon, CompassIcon } from 'hugeicons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { EnvvalLogo } from '@/components/logo/envval';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { OnboardingTransition } from '@/components/onboarding/onboarding-transition';
import { ProfileStep } from '@/components/onboarding/profile-step';
import { AttributionStep } from '@/components/onboarding/attribution-step';
import { StepProgress, type StepConfig } from '@/components/onboarding/step-progress';
import { onboardingSchema, type OnboardingFormValues } from '@/components/onboarding/types';

const searchSchema = z.object({
	step: z.enum(['1', '2', 'complete']).optional(),
});

export const Route = createFileRoute('/welcome')({
	component: RouteComponent,
	validateSearch: searchSchema,
});

const steps: StepConfig[] = [
	{ id: 1, label: 'Your name', icon: UserIcon },
	{ id: 2, label: 'How did you hear?', icon: CompassIcon },
];

function RouteComponent() {
	const { step: stepParam } = Route.useSearch();
	const initialStep = stepParam === '1' ? 1 : stepParam === '2' ? 2 : 1;
	const initialComplete = stepParam === 'complete';

	const [step, setStep] = useState(initialStep);
	const [isComplete, setIsComplete] = useState(initialComplete);
	const navigate = useNavigate();

	const form = useForm<OnboardingFormValues>({
		resolver: zodResolver(onboardingSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			source: '',
			medium: '',
			details: '',
		},
	});

	const goNext = async () => {
		if (step === 1) {
			const valid = await form.trigger(['firstName', 'lastName']);
			if (!valid) return;
		}
		setStep((s) => Math.min(s + 1, steps.length));
	};

	const goBack = () => setStep((s) => Math.max(s - 1, 1));

	const onSubmit = (data: OnboardingFormValues) => {
		console.log(data);
		setIsComplete(true);
	};

	const handleContinueToDashboard = () => {
		navigate({ to: '/' });
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
						steps={steps}
						currentStep={step}
						className='pb-20'
					/>
					<div className='min-h-[500px]'>
						<div className='flex flex-col items-center gap-3 pb-10 '>
							<EnvvalLogo className='size-12' />
							<div className='text-center'>
								<h1 className='text-2xl font-semibold'>Welcome to Envval</h1>
								<p className='text-sm text-muted-foreground'>
									Just two quick steps to finish setting up your account.
								</p>
							</div>
						</div>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-6'
							>
								<div className=''>
									{step === 1 && <ProfileStep />}
									{step === 2 && <AttributionStep />}
								</div>

								<div className='flex items-center justify-between pt-2'>
									<Button
										type='button'
										variant='muted'
										onClick={goBack}
										disabled={step === 1}
									>
										Back
									</Button>
									{step < steps.length ? (
										<Button
											type='button'
											onClick={goNext}
										>
											Next
										</Button>
									) : (
										<Button type='submit'>Finish</Button>
									)}
								</div>
							</form>
						</Form>
					</div>
				</div>
				<div className='w-screen border-b border-border' />
			</div>
		</OnboardingTransition>
	);
}
