import { Button } from "@envval/ui/components/button";
import { Input } from "@envval/ui/components/input";
import {
	ResponsiveAlert,
	ResponsiveAlertContent,
	ResponsiveAlertFooter,
	ResponsiveAlertHeader,
	ResponsiveAlertTitle,
} from "@envval/ui/components/responsive-alert";
import { useNavigate } from "@tanstack/react-router";
import {
	Alert02Icon,
	ArrowTurnBackwardIcon,
	Delete02Icon,
} from "hugeicons-react";
import { useState } from "react";
import { useDeleteAccount, useDeleteAllRepos } from "@/hooks/user/use-user";
import { normalizeClientError } from "@/lib/error";
import { toast } from "@/lib/toast";
import { InlineCopyButton } from "../repos/delete-repo-dialog";

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="pointer-events-none ml-1.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
			{children}
		</kbd>
	);
}

/**
 * Danger Zone with two destructive actions: delete all repos and delete account.
 */
export function DangerZoneSection() {
	const [showDeleteRepos, setShowDeleteRepos] = useState(false);
	const [showDeleteAccount, setShowDeleteAccount] = useState(false);
	const [confirmText, setConfirmText] = useState("");

	const deleteAllRepos = useDeleteAllRepos();
	const deleteAccount = useDeleteAccount();
	const navigate = useNavigate();

	const handleDeleteRepos = async () => {
		try {
			await deleteAllRepos.mutateAsync();
			toast.success("All repositories deleted");
			setShowDeleteRepos(false);
			navigate({ to: "/dashboard" });
		} catch (error) {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to delete repositories",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		}
	};

	const handleDeleteAccount = async () => {
		if (confirmText !== "DELETE") {
			toast.error("Confirmation text does not match");
			return;
		}

		try {
			await deleteAccount.mutateAsync(confirmText);
			toast.success("Account deleted");
			setShowDeleteAccount(false);
			// Redirect to home/login after account deletion
			window.location.href = "/";
		} catch (error) {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to delete account",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		}
	};

	return (
		<>
			<div className="w-full p-1 rounded-xl mb-5 bg-muted/50">
				<div className="rounded-lg bg-background border border-destructive/20 overflow-hidden">
					{/* Header */}
					<div className="px-4 py-3 border-b border-destructive/20 bg-destructive/5">
						<div className="flex items-center gap-2">
							<Alert02Icon
								className="size-4 text-destructive"
								aria-hidden="true"
							/>
							<h3 className="text-sm font-medium text-destructive">
								Danger Zone
							</h3>
						</div>
					</div>

					{/* Body */}
					<>
						{/* Delete All Repositories */}
						<div className="flex items-end justify-between gap-4 p-4 border-b">
							<div className="flex-1">
								<h4 className="text-sm font-medium text-foreground">
									Delete All Repositories
								</h4>
								<p className="text-xs text-muted-foreground mt-1">
									Permanently delete all your repositories and their environment
									files. This action cannot be undone.
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setShowDeleteRepos(true)}
								className="shrink-0"
							>
								<Delete02Icon className="size-4" aria-hidden="true" />
								Delete All Repos
							</Button>
						</div>

						{/* Delete Account */}
						<div className="flex items-end justify-between gap-4 p-4">
							<div className="flex-1">
								<h4 className="text-sm font-medium text-foreground">
									Delete Account
								</h4>
								<p className="text-xs text-muted-foreground mt-1">
									Permanently delete your account and all associated data. This
									will delete all repositories, environments, devices, and
									sessions.
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setShowDeleteAccount(true)}
								className="shrink-0"
							>
								<Delete02Icon className="size-4" aria-hidden="true" />
								Delete Account
							</Button>
						</div>
					</>
				</div>
			</div>

			{/* Delete All Repos Dialog */}
			<ResponsiveAlert open={showDeleteRepos} onOpenChange={setShowDeleteRepos}>
				<ResponsiveAlertContent>
					<ResponsiveAlertHeader>
						<ResponsiveAlertTitle className="flex items-center gap-2">
							<Alert02Icon
								className="size-5 text-destructive"
								aria-hidden="true"
							/>
							Delete All Repositories?
						</ResponsiveAlertTitle>
					</ResponsiveAlertHeader>

					<div className="mt-1 space-y-3">
						<p className="text-sm text-muted-foreground">
							This will permanently delete all your repositories and their
							environment files.
						</p>
						<p className="text-sm font-medium text-destructive">
							This action cannot be undone.
						</p>
					</div>

					<ResponsiveAlertFooter className="mt-6">
						<Button
							variant="destructive"
							onClick={handleDeleteRepos}
							pending={deleteAllRepos.isPending}
							disabled={deleteAllRepos.isPending}
							pendingText="Deleting..."
						>
							Delete All Repositories
							<ArrowTurnBackwardIcon
								className="size-3.5 rotate-180"
								aria-hidden="true"
							/>
						</Button>
						<Button
							variant="outline"
							onClick={() => setShowDeleteRepos(false)}
							disabled={deleteAllRepos.isPending}
						>
							Cancel
							<Kbd>Esc</Kbd>
						</Button>
					</ResponsiveAlertFooter>
				</ResponsiveAlertContent>
			</ResponsiveAlert>

			{/* Delete Account Dialog */}
			<ResponsiveAlert
				open={showDeleteAccount}
				onOpenChange={(open) => {
					setShowDeleteAccount(open);
					if (!open) setConfirmText("");
				}}
			>
				<ResponsiveAlertContent>
					<ResponsiveAlertHeader>
						<ResponsiveAlertTitle className="flex items-center gap-2">
							<Alert02Icon
								className="size-5 text-destructive"
								aria-hidden="true"
							/>
							Delete Account Permanently?
						</ResponsiveAlertTitle>
					</ResponsiveAlertHeader>

					<div className="mt-1 space-y-4">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								This will permanently delete your account and all associated
								data including:
							</p>
							<ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 ml-2">
								<li>All repositories and environments</li>
								<li>All devices and sessions</li>
								<li>Profile and settings</li>
							</ul>
						</div>
						<p className="text-sm font-medium text-destructive">
							This action is irreversible and cannot be undone.
						</p>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Type <InlineCopyButton text="DELETE" /> to confirm.
							</p>
							<Input
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder="Enter DELETE"
								autoComplete="off"
								disabled={deleteAccount.isPending}
							/>
						</div>
					</div>

					<ResponsiveAlertFooter className="mt-6">
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							pending={deleteAccount.isPending}
							disabled={confirmText !== "DELETE" || deleteAccount.isPending}
							pendingText="Deleting..."
						>
							Delete Account Forever
							<ArrowTurnBackwardIcon
								className="size-3.5 rotate-180"
								aria-hidden="true"
							/>
						</Button>
						<Button
							variant="outline"
							onClick={() => setShowDeleteAccount(false)}
							disabled={deleteAccount.isPending}
						>
							Cancel
							<Kbd>Esc</Kbd>
						</Button>
					</ResponsiveAlertFooter>
				</ResponsiveAlertContent>
			</ResponsiveAlert>
		</>
	);
}
