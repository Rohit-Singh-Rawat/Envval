import { useSuspenseQuery } from '@tanstack/react-query';
import client from '@/lib/api';

export function useRepoSummary(repoId: string) {
	return useSuspenseQuery({
		queryKey: ['repo', repoId],
		queryFn: async () => {
			const response = await client.api.v1.repos[':repoId'].$get({
				param: {
					repoId,
				},
			});
			return response.json();
		},
	});
}

export function useRepoEnvs(repoId: string) {
	return useSuspenseQuery({
		queryKey: ['repo-envs', repoId],
		queryFn: async () => {
			const response = await client.api.v1.repos[':repoId'].environments.$get({
				param: {
					repoId,
				},
			});
			return response.json();
		},
	});
}
