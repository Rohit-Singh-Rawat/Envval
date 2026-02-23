import { useSuspenseQuery } from "@tanstack/react-query";
import client from "@/lib/api";

export function useRepoSummary(repoId: string) {
	return useSuspenseQuery({
		queryKey: ["repo", repoId],
		queryFn: async () => {
			const response = await client.api.v1.repos[":repoId"].$get({
				param: {
					repoId,
				},
			});
			return response.json();
		},
	});
}

export function useRepoSummaryBySlug(slug: string) {
	return useSuspenseQuery({
		queryKey: ["repo", "by-slug", slug],
		queryFn: async () => {
			const response = await client.api.v1.repos["by-slug"][":slug"].$get({
				param: {
					slug,
				},
			});
			return response.json();
		},
	});
}

export function useRepoEnvs(repoId: string, includeContent = false) {
	return useSuspenseQuery({
		queryKey: ["repo-envs", repoId, includeContent],
		queryFn: async () => {
			const response = await client.api.v1.repos[":repoId"].environments.$get({
				param: {
					repoId,
				},
				query: {
					includeContent: includeContent.toString(),
				},
			});
			return response.json();
		},
	});
}
