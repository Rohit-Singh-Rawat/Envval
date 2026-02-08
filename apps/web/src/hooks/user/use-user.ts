import client from '@/lib/api';
import {  useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

export type NotificationPreferences = {
	newRepoAdded: boolean;
	newDeviceLogin: boolean;
};

export type UserProfile = {
	id: string;
	name: string;
	email: string;
	displayName: string | null;
	avatar: string;
	notificationPreferences: NotificationPreferences;
	createdAt: string;
};

type ProfileResponse = {
	profile: UserProfile;
};

/**
 * Fetches user profile with display name, avatar, and notification preferences.
 */
export function useUserProfile() {
	return useSuspenseQuery({
		queryKey: ['user', 'profile'],
		queryFn: async () => {
			const response = await client.api.v1.user.profile.$get();
			const data = (await response.json()) as ProfileResponse;
			return data.profile;
		},
	});
}

type UpdateProfileData = {
	displayName?: string;
	avatar?:
		| 'avatar-1'
		| 'avatar-2'
		| 'avatar-3'
		| 'avatar-4'
		| 'avatar-5'
		| 'avatar-6'
		| 'avatar-7'
		| 'avatar-8'
		| 'avatar-9'
		| 'avatar-10';
};

/**
 * Updates user display name and/or avatar with optimistic updates.
 */
export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateProfileData) => {
			const response = await client.api.v1.user.profile.$patch({ json: data });
			const result = (await response.json()) as ProfileResponse;
			return result.profile;
		},
		onMutate: async (newData) => {
			await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });

			const previousProfile = queryClient.getQueryData<UserProfile>(['user', 'profile']);

			if (previousProfile) {
				queryClient.setQueryData<UserProfile>(['user', 'profile'], {
					...previousProfile,
					...newData,
				});
			}

			return { previousProfile };
		},
		onError: (_err, _newData, context) => {
			if (context?.previousProfile) {
				queryClient.setQueryData(['user', 'profile'], context.previousProfile);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
		},
	});
}

/**
 * Updates user notification preferences with optimistic updates.
 */
export function useUpdateNotifications() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (preferences: NotificationPreferences) => {
			const response = await client.api.v1.user.notifications.$patch({ json: preferences });
			return await response.json();
		},
		onMutate: async (newPreferences) => {
			await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });

			const previousProfile = queryClient.getQueryData<UserProfile>(['user', 'profile']);

			if (previousProfile) {
				queryClient.setQueryData<UserProfile>(['user', 'profile'], {
					...previousProfile,
					notificationPreferences: newPreferences,
				});
			}

			return { previousProfile };
		},
		onError: (_err, _newPrefs, context) => {
			if (context?.previousProfile) {
				queryClient.setQueryData(['user', 'profile'], context.previousProfile);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
		},
	});
}

export type UserStats = {
	totalRepositories: number;
	totalEnvironments: number;
	lastSync: string | null;
	accountCreated: string | null;
};

/**
 * Fetches user statistics (repo count, env count, last activity).
 */
export function useUserStats() {
	return useSuspenseQuery({
		queryKey: ['user', 'stats'],
		queryFn: async () => {
			const response = await client.api.v1.user.stats.$get();
			const data = (await response.json()) as { stats: UserStats };
			return data.stats;
		},
	});
}

/**
 * Deletes all user repositories with cascading environment deletion.
 */
export function useDeleteAllRepos() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const response = await client.api.v1.user.repositories.$delete();
			return await response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['repos'] });
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
		},
	});
}

/**
 * Permanently deletes user account and all associated data.
 */
export function useDeleteAccount() {
	return useMutation({
		mutationFn: async (confirmation: string) => {
			const response = await client.api.v1.user.account.$delete({ json: { confirmation } });
			return await response.json();
		},
	});
}
