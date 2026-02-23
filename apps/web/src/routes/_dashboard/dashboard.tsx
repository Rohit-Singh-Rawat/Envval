import { Button } from "@envval/ui/components/button";
import { Skeleton } from "@envval/ui/components/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@envval/ui/components/tooltip";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock01Icon, Delete01Icon, Key01Icon } from "hugeicons-react";
import { useState } from "react";
import { Heading } from "@/components/dashboard/shared/heading";
import {
	GetStartedWizard,
	isOnboardingCompleted,
} from "@/components/onboarding/get-started-wizard-v2";
import { DeleteRepoDialog } from "@/components/repos/delete-repo-dialog";
import { EmptyProjectsIllustration } from "@/components/repos/empty-projects-illustration";
import { type Project, useGetRepos } from "@/hooks/repos/use-get-repos";
import { formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <DashboardContent />;
}

function DashboardContent() {
	const { data: repos = [], isPending } = useGetRepos();
	const [onboardingDismissed, setOnboardingDismissed] = useState(
		isOnboardingCompleted,
	);

	const hasRepos = repos.length > 0;
	const showWizard = !isPending && !hasRepos && !onboardingDismissed;

	return (
		<>
			<Heading
				title="Projects"
				description="Manage your projects and their associated data."
			/>

			<section className="w-full">
				{isPending ? (
					<div className="flex flex-col gap-1">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="flex flex-col sm:flex-row sm:items-center justify-between p-2 px-4 rounded-lg border border-border/50 gap-4"
							>
								<div className="flex flex-col gap-2 min-w-0 flex-1">
									<Skeleton className="h-5 w-40 rounded-md" />
									<Skeleton className="h-4 w-60 rounded-md" />
								</div>
								<div className="flex items-center gap-6">
									<Skeleton className="h-4 w-8 rounded-md" />
									<Skeleton className="h-4 w-16 rounded-md" />
								</div>
							</div>
						))}
					</div>
				) : showWizard ? (
					<GetStartedWizard onComplete={() => setOnboardingDismissed(true)} />
				) : hasRepos ? (
					<ProjectList repos={repos} />
				) : (
					<EmptyState onGetStarted={() => setOnboardingDismissed(false)} />
				)}
			</section>
		</>
	);
}

function EmptyState({ onGetStarted }: { onGetStarted: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-5 text-center gap-5">
			<EmptyProjectsIllustration />
			<div>
				<p className="text-muted-foreground font-medium">No projects yet</p>
				<p className="text-sm text-muted-foreground/70 mt-1">
					Push your first .env from VS Code to see it here
				</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				className="text-xs text-muted-foreground/60"
				onClick={onGetStarted}
			>
				View setup guide
			</Button>
		</div>
	);
}

function ProjectItem({
	project,
	onDeleteClick,
}: {
	project: Project;
	onDeleteClick: (project: Project) => void;
}) {
	const handleDeleteClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDeleteClick(project);
	};

	return (
		<li>
			<Link
				to="/repos/$slug"
				params={{ slug: project.slug }}
				className="flex flex-col sm:flex-row sm:items-center justify-between p-2 px-4 rounded-lg squircle border border-border/50 hover:bg-muted/50 transition-all group gap-4"
				aria-label={`View ${project.name} project`}
			>
				<div className="flex flex-col gap-1 min-w-0 flex-1">
					<span className="font-normal text-lg truncate tracking-tight">
						{project.name}
					</span>
					<span className="text-sm text-muted-foreground truncate max-w-md">
						{project.gitRemoteUrl ?? "No remote URL"}
					</span>
				</div>

				<div className="flex items-center justify-between sm:justify-end gap-6 text-sm text-muted-foreground shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
					<div className="flex items-center gap-6">
						<Tooltip>
							<TooltipTrigger>
								<div
									className="flex items-center gap-1.5 cursor-default"
									tabIndex={0}
								>
									<Key01Icon
										className="size-4 text-primary/70"
									/>
									<span className="font-medium">{project.environments}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{project.environments} environment
									{project.environments !== 1 ? "s" : ""}
								</p>
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger>
								<div
									className="flex items-center gap-1.5 cursor-default"
									tabIndex={0}
								>
									<Clock01Icon
										className="size-4 text-muted-foreground/70"
									/>
									<span>{formatRelativeTime(project.lastSyncedAt)}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Last synced:{" "}
									{project.lastSyncedAt
										? new Date(project.lastSyncedAt).toLocaleString()
										: "Never"}
								</p>
							</TooltipContent>
						</Tooltip>
					</div>

					<Tooltip>
						<TooltipTrigger>
							<button
								type="button"
								onClick={handleDeleteClick}
								className="p-2 -m-2 rounded-lg opacity-100 sm:opacity-0 hover:bg-destructive/20 group-hover:opacity-100 hover:text-destructive transition-all focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
								aria-label={`Delete ${project.name} repository`}
							>
								<Delete01Icon className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Delete repository</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</Link>
		</li>
	);
}

function ProjectList({ repos }: { repos: Project[] }) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRepo, setSelectedRepo] = useState<Project | null>(null);

	const handleDeleteClick = (project: Project) => {
		setSelectedRepo(project);
		setDeleteDialogOpen(true);
	};

	return (
		<>
			<ul
				className="flex flex-col gap-1"
				aria-label="Projects list"
			>
				{repos.map((repo) => (
					<ProjectItem
						key={repo.id}
						project={repo}
						onDeleteClick={handleDeleteClick}
					/>
				))}
			</ul>

			{selectedRepo && (
				<DeleteRepoDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					repo={{ name: selectedRepo.name, slug: selectedRepo.slug }}
				/>
			)}
		</>
	);
}
