import { createFileRoute } from '@tanstack/react-router';
import { RepoHeader } from '@/components/repos/repo-header';
import { RepoEnvLists } from '@/components/repos/repo-env-lists';

export const Route = createFileRoute('/_dashboard/repos/$repoId')({
	component: RouteComponent,
});

function RouteComponent() {
	const { repoId } = Route.useParams();
	return (
		<>
			<RepoHeader repoId={repoId} />
			<RepoEnvLists repoId={repoId} />
		</>
	);
}
