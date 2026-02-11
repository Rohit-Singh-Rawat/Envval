import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/lib/api';
import { toast } from '@/lib/toast';

type DeleteRepoParams = {
	slug: string;
};

export function useDeleteRepo() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ slug }: DeleteRepoParams) => {
			const response = await client.api.v1.repos['by-slug'][':slug'].$delete({
				param: { slug },
			});

			if (!response.ok) {
				const error = await response
					.json()
					.catch(() => ({ error: 'Failed to delete repository' }));
				throw new Error((error as { error: string }).error || 'Failed to delete repository');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['repos'] });
			toast.success('Repository deleted successfully');
		},
		onError: (error) => {
			const message = error instanceof Error ? error.message : 'Failed to delete repository';
			toast.error(message);
		},
	});
}
