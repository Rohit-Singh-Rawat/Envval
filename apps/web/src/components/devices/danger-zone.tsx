import { Button } from "@envval/ui/components/button";
import {
	ResponsiveAlert,
	ResponsiveAlertContent,
	ResponsiveAlertFooter,
	ResponsiveAlertHeader,
	ResponsiveAlertTitle,
} from "@envval/ui/components/responsive-alert";
import { Alert02Icon, ArrowTurnBackwardIcon } from "hugeicons-react";
import { useState } from "react";

interface RemoveAllDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending: boolean;
	otherDeviceCount: number;
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="pointer-events-none ml-1.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
			{children}
		</kbd>
	);
}

function RemoveAllDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
	otherDeviceCount,
}: RemoveAllDialogProps) {
	return (
		<ResponsiveAlert open={open} onOpenChange={onOpenChange}>
			<ResponsiveAlertContent>
				<ResponsiveAlertHeader>
					<ResponsiveAlertTitle className="flex items-center gap-2">
						<Alert02Icon
							className="size-5 text-destructive"
							aria-hidden="true"
						/>
						Remove All Other Devices?
					</ResponsiveAlertTitle>
				</ResponsiveAlertHeader>

				<div className="mt-1 space-y-3">
					<p className="text-sm text-muted-foreground">
						This will remove access for{" "}
						<strong className="font-semibold text-foreground">
							{otherDeviceCount} other device{otherDeviceCount !== 1 ? "s" : ""}
						</strong>
						. They will need to re-authenticate to regain access.
					</p>
					<p className="text-sm font-medium text-destructive">
						This action cannot be undone.
					</p>
				</div>

				<ResponsiveAlertFooter className="mt-6">
					<Button
						variant="destructive"
						onClick={onConfirm}
						pending={isPending}
						disabled={isPending}
						pendingText="Removing..."
					>
						Remove All Others
						<ArrowTurnBackwardIcon
							className="size-3.5 rotate-180"
							aria-hidden="true"
						/>
					</Button>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
						<Kbd>Esc</Kbd>
					</Button>
				</ResponsiveAlertFooter>
			</ResponsiveAlertContent>
		</ResponsiveAlert>
	);
}

interface DangerZoneProps {
	onRemoveAll: () => void;
	disabled: boolean;
	deviceCount: number;
}

export function DangerZone({
	onRemoveAll,
	disabled,
	deviceCount,
}: DangerZoneProps) {
	const [showDialog, setShowDialog] = useState(false);

	const handleConfirm = () => {
		onRemoveAll();
		setShowDialog(false);
	};

	// Only show if there are other devices to remove (more than just current device)
	if (deviceCount <= 1) {
		return null;
	}

	const otherDeviceCount = deviceCount - 1;

	return (
		<>
			<div className="mt-6 w-full p-1 rounded-xl bg-muted/50">
				<div className="rounded-lg bg-background border overflow-hidden">
					<div className="px-4 py-3 border-b bg-muted/30">
						<h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
					</div>

					<div className="px-4 py-3">
						<div className="space-y-1">
							<h4 className="text-sm font-normal text-foreground">
								Remove All Devices
							</h4>
							<p className="text-xs text-muted-foreground">
								Immediately remove access for all other devices. This will sign
								them out and require re-authentication.
							</p>
						</div>
					</div>

					<div className="px-4 py-3 border-t bg-muted/50">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-start gap-2 flex-1">
								<Alert02Icon
									className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
									aria-hidden="true"
								/>
								<p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
									This action cannot be undone. Use only if you suspect
									unauthorized access.
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setShowDialog(true)}
								disabled={disabled}
								className="shrink-0"
							>
								Remove All
							</Button>
						</div>
					</div>
				</div>
			</div>

			<RemoveAllDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				onConfirm={handleConfirm}
				isPending={disabled}
				otherDeviceCount={otherDeviceCount}
			/>
		</>
	);
}
