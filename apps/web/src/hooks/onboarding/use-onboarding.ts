import { useMutation } from '@tanstack/react-query';
import client from '@/lib/api';

interface OnboardingData {
	organizationName: string;
	projectName?: string;
}

export function useOnboarding() {
	return useMutation({
		mutationFn: async (data: OnboardingData) => {
			const response = await client.api.v1.onboarding.$post({
				json: data,
			});
			if (!response.ok) {
				throw new Error('Failed to complete onboarding');
			}

			return response.json();
		},
	});
}
