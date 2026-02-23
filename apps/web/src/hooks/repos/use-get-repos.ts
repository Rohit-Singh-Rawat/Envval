import { keepPreviousData, useQuery } from "@tanstack/react-query";
import client from "@/lib/api";

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
		queryKey: ["repos", search],
		queryFn: async () => {
			const query: Record<string, string> = {
				page: "1",
				limit: "10",
			};

			if (search) {
				query.search = search;
			}

			const response = await client.api.v1.repos.$get({ query });

			if (!response.ok) {
				throw new Error(`Failed to fetch repositories: ${response.status}`);
			}

			const data = await response.json();

			// Guard against unexpected error shape from the API
			if (!Array.isArray(data)) {
				throw new Error("Unexpected response shape from /repos");
			}

			return data as Project[];
		},
		placeholderData: keepPreviousData,
	});
};
