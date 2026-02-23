import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import client from "@/lib/api";
import type { AvatarId } from "@/lib/avatars";

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

export function useUserProfile() {
	return useSuspenseQuery({
		queryKey: ["user", "profile"],
		queryFn: async () => {
			const response = await client.api.v1.user.profile.$get();
			const data = (await response.json()) as ProfileResponse;
			return data.profile;
		},
	});
}

type UpdateProfileData = {
	displayName?: string;
	avatar?: AvatarId;
};

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateProfileData) => {
			const response = await client.api.v1.user.profile.$patch({ json: data });
			const result = (await response.json()) as ProfileResponse;
			return result.profile;
		},
		onMutate: async (newData) => {
			await queryClient.cancelQueries({ queryKey: ["user", "profile"] });

			const previousProfile = queryClient.getQueryData<UserProfile>([
				"user",
				"profile",
			]);

			if (previousProfile) {
				queryClient.setQueryData<UserProfile>(["user", "profile"], {
					...previousProfile,
					...newData,
				});
			}

			return { previousProfile };
		},
		onError: (_err, _newData, context) => {
			if (context?.previousProfile) {
				queryClient.setQueryData(["user", "profile"], context.previousProfile);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
}

export function useUpdateNotifications() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (preferences: NotificationPreferences) => {
			const response = await client.api.v1.user.notifications.$patch({
				json: preferences,
			});
			return await response.json();
		},
		onMutate: async (newPreferences) => {
			await queryClient.cancelQueries({ queryKey: ["user", "profile"] });

			const previousProfile = queryClient.getQueryData<UserProfile>([
				"user",
				"profile",
			]);

			if (previousProfile) {
				queryClient.setQueryData<UserProfile>(["user", "profile"], {
					...previousProfile,
					notificationPreferences: newPreferences,
				});
			}

			return { previousProfile };
		},
		onError: (_err, _newPrefs, context) => {
			if (context?.previousProfile) {
				queryClient.setQueryData(["user", "profile"], context.previousProfile);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
}

export type UserStats = {
	totalRepositories: number;
	totalEnvironments: number;
	lastSync: string | null;
	accountCreated: string | null;
};

export function useUserStats() {
	return useSuspenseQuery({
		queryKey: ["user", "stats"],
		queryFn: async () => {
			const response = await client.api.v1.user.stats.$get();
			const data = (await response.json()) as { stats: UserStats };
			return data.stats;
		},
	});
}

export function useDeleteAllRepos() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const response = await client.api.v1.user.repositories.$delete();
			return await response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["repos"] });
			queryClient.invalidateQueries({ queryKey: ["environments"] });
			queryClient.invalidateQueries({ queryKey: ["user", "stats"] });
		},
	});
}

export function useDeleteAccount() {
	return useMutation({
		mutationFn: async (confirmation: string) => {
			const response = await client.api.v1.user.account.$delete({
				json: { confirmation },
			});
			return await response.json();
		},
	});
}
