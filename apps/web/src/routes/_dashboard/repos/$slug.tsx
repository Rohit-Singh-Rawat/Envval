import { createFileRoute } from '@tanstack/react-router';
import { RepoHeader } from '@/components/repos/repo-header';
import { RepoEnvLists } from '@/components/repos/repo-env-lists';

export const Route = createFileRoute('/_dashboard/repos/$slug')({
	component: RouteComponent,
});

function RouteComponent() {
	const { slug } = Route.useParams();
	return (
		<>
			<RepoHeader slug={slug} />
			<RepoEnvLists slug={slug} />
		</>
	);
}
