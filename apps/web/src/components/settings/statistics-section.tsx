import {
	Clock01Icon,
	Database01Icon,
	File02Icon,
	UserIdVerificationIcon,
} from "hugeicons-react";
import { useUserStats } from "@/hooks/user/use-user";

/**
 * Displays read-only usage statistics in a grid layout.
 */
export function StatisticsSection() {
	const { data: stats } = useUserStats();

	const lastSyncText = stats.lastSync
		? new Date(stats.lastSync).toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			})
		: "Never";

	const createdText = stats.accountCreated
		? new Date(stats.accountCreated).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: "Unknown";

	return (
		<div className="w-full p-1 rounded-xl bg-muted/50">
			<div className="rounded-lg bg-background border overflow-hidden">
				{/* Header */}
				<div className="px-4 py-3 border-b bg-muted/30">
					<h3 className="text-sm font-medium text-foreground">
						Usage & Statistics
					</h3>
				</div>

				{/* Body - Grid of stats */}
				<div className="p-6 grid grid-cols-2 gap-6">
					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-muted/60 shrink-0">
							<Database01Icon
								className="size-4 text-blue-600 dark:text-blue-400"
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Total Repositories
							</p>
							<p className="text-2xl font-normal text-foreground mt-1">
								{stats.totalRepositories}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-muted/60 shrink-0">
							<File02Icon
								className="size-4 text-purple-600 dark:text-purple-400"
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Total Environments
							</p>
							<p className="text-2xl font-normal text-foreground mt-1">
								{stats.totalEnvironments}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-muted/60 shrink-0">
							<Clock01Icon
								className="size-4 text-green-600 dark:text-green-400"
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Last Sync</p>
							<p className="text-sm font-normal text-foreground mt-1">
								{lastSyncText}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-muted/60 shrink-0">
							<UserIdVerificationIcon
								className="size-4 text-orange-600 dark:text-orange-400"
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Account Created</p>
							<p className="text-sm font-normal text-foreground mt-1">
								{createdText}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
