import client from '@/lib/api';
import { useSuspenseQuery } from '@tanstack/react-query';

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
			return response.json();
		},
	});
};
