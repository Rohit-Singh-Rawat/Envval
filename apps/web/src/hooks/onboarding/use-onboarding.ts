import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import client from '@/lib/api';
import { onboardingSchema, type OnboardingFormValues } from '@/components/onboarding/types';

type UseOnboardingOptions = {
	initialStep?: number;
	initialComplete?: boolean;
	totalSteps: number;
};

export function useOnboarding({
	initialStep = 1,
	initialComplete = false,
	totalSteps,
}: UseOnboardingOptions) {
	const [step, setStep] = useState(initialStep);
	const [isComplete, setIsComplete] = useState(initialComplete);
	const navigate = useNavigate();

	const form = useForm<OnboardingFormValues>({
		resolver: zodResolver(onboardingSchema),
		mode: 'onChange',
		defaultValues: {
			firstName: '',
			lastName: '',
			source: '',
			medium: '',
			details: '',
		},
	});

	const onboardingMutation = useMutation({
		mutationFn: async (data: OnboardingFormValues) => {
			const payload = {
				name: data.firstName,
				...(data.lastName && { lastName: data.lastName }),
				source: data.source || null,
				medium: data.medium || null,
				details: data.details || null,
			};
			const response = await client.api.v1.onboarding.$post({
				json: payload,
			});
			if (!response.ok) {
				const error = await response
					.json()
					.catch(() => ({ message: 'Failed to complete onboarding' }));
				throw new Error(error.message || 'Failed to complete onboarding');
			}
			return response.json();
		},
		onSuccess: () => {
			toast.success('Onboarding completed successfully!');
			setIsComplete(true);
			navigate({
				to: '/welcome',
				search: { step: 'complete' },
			});
		},
		onError: (error) => {
			const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
			toast.error(message);
		},
	});

	const validateCurrentStep = useCallback(async (): Promise<boolean> => {
		if (step === 1) {
			// Validate only firstName for step 1
			const isValid = await form.trigger('firstName');
			return isValid;
		}
		if (step === 2) {
			// Validate source and medium for step 2
			const isValid = await form.trigger(['source', 'medium']);
			return isValid;
		}
		return true;
	}, [step, form]);

	const goNext = useCallback(async () => {
		const isValid = await validateCurrentStep();
		if (isValid && step < totalSteps) {
			setStep(step + 1);
			navigate({
				to: '/welcome',
				search: { step: String(step + 1) as '1' | '2' },
			});
		}
	}, [step, totalSteps, validateCurrentStep, navigate]);

	const goBack = useCallback(() => {
		if (step > 1) {
			setStep(step - 1);
			navigate({
				to: '/welcome',
				search: { step: String(step - 1) as '1' | '2' },
			});
		}
	}, [step, navigate]);

	const onSubmit = useCallback(
		async (data: OnboardingFormValues) => {
			if (step === totalSteps) {
				await onboardingMutation.mutateAsync(data);
			}
		},
		[step, totalSteps, onboardingMutation]
	);

	return {
		step,
		isComplete,
		form,
		goNext,
		goBack,
		onSubmit,
		isSubmitting: onboardingMutation.isPending,
	};
}
