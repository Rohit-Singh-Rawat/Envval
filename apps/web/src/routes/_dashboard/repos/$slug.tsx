import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RepoHeader } from '@/components/repos/repo-header';
import { RepoEnvLists } from '@/components/repos/repo-env-lists';

export const Route = createFileRoute('/_dashboard/repos/$slug')({
	component: RouteComponent,
});

function RouteComponent() {
	const { slug } = Route.useParams();

	return (
		<div className="flex flex-col min-h-full">
			<Suspense fallback={<HeaderSkeleton />}>
				<RepoHeader slug={slug} />
			</Suspense>

			<div className="flex-1">
				<Suspense fallback={<ContentSkeleton />}>
					<RepoEnvLists slug={slug} />
				</Suspense>
			</div>
		</div>
	);
}

function HeaderSkeleton() {
	return (
		<header className="w-full bg-background">
			<div className="flex items-center justify-between w-full">
				<div className="flex flex-col gap-1.5">
					<div className="h-7 w-36 bg-muted animate-pulse rounded" />
					<div className="flex items-center gap-1.5">
						<div className="size-3.5 bg-muted animate-pulse rounded" />
						<div className="h-4 w-56 bg-muted animate-pulse rounded" />
					</div>
				</div>
				<div className="size-8 rounded-lg bg-muted animate-pulse" />
			</div>
		</header>
	);
}

function ContentSkeleton() {
	return (
		<section className="w-full">
			<div className="flex items-center justify-between my-4">
				<div className="h-6 w-36 bg-muted animate-pulse rounded" />
				<div className="h-4 w-14 bg-muted animate-pulse rounded" />
			</div>
			<ul className="space-y-3">
				<EnvCardSkeleton />
				<EnvCardSkeleton />
			</ul>
		</section>
	);
}

function EnvCardSkeleton() {
	return (
		<li className="w-full p-1 rounded-xl bg-muted/50">
			<div className="flex items-center justify-between p-2 px-4">
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-2">
						<div className="h-5 w-24 bg-muted animate-pulse rounded" />
						<div className="h-4 w-20 bg-muted/70 animate-pulse rounded border" />
					</div>
					<div className="h-3.5 w-32 bg-muted animate-pulse rounded" />
				</div>
			</div>
			<div className="rounded-lg bg-background border overflow-hidden">
				<div className="px-3 py-2 space-y-2">
					<EnvRowSkeleton />
					<EnvRowSkeleton />
					<EnvRowSkeleton />
				</div>
			</div>
		</li>
	);
}

function EnvRowSkeleton() {
	return (
		<div className="flex items-center justify-between py-2">
			<div className="flex items-center gap-2">
				<div className="h-4 w-20 bg-muted animate-pulse rounded" />
				<div className="h-4 w-1.5 bg-muted/50 rounded" />
				<div className="h-4 w-32 bg-muted/60 animate-pulse rounded" />
			</div>
			<div className="flex items-center gap-1">
				<div className="size-6 bg-muted animate-pulse rounded" />
				<div className="size-6 bg-muted animate-pulse rounded" />
			</div>
		</div>
	);
}
