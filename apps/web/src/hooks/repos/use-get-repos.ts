import client from '@/lib/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

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

export const useGetRepos = ({ search }: { search?: string } = {}) => {
	return useQuery({
		queryKey: ['repos', search],
		queryFn: async () => {
			const query: Record<string, string> = {
				page: '1',
				limit: '10',
			};

			if (search) {
				query.search = search;
			}

			const response = await client.api.v1.repos.$get({
				query,
			});
			const data = await response.json();
			return data as Project[];
		},
		placeholderData: keepPreviousData,
	});
};
