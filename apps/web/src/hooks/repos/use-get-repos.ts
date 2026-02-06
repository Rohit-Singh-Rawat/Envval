import client from '@/lib/api';
import { useSuspenseQuery } from '@tanstack/react-query';

export interface Project {
	id: string;
	name: string;
	slug: string;
	gitRemoteUrl: string | null;
	workspacePath: string | null;
	environments: number;
	lastSyncedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export const useGetRepos = () => {
	return useSuspenseQuery({
		queryKey: ['repos'],
		queryFn: async () => {
			const response = await client.api.v1.repos.$get({
				query: {
					page: '1',
					limit: '10',
				},
			});
			const data = await response.json();
			return data as Project[];
		},
	});
};
