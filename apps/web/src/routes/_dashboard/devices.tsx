import { createFileRoute } from "@tanstack/react-router";
import { ComputerIcon } from "hugeicons-react";
import { Suspense } from "react";
import { Heading } from "@/components/dashboard/shared/heading";
import { DangerZone } from "@/components/devices/danger-zone";
import { DevicesTable } from "@/components/devices/device-card";
import {
	useDeleteAllDevices,
	useDeleteDevice,
	useDevices,
} from "@/hooks/devices/use-devices";
import { normalizeClientError } from "@/lib/error";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/_dashboard/devices")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<Heading
				title="Devices"
				description="Manage devices that have access to your environment variables"
			/>

			<div className="flex-1">
				<Suspense fallback={<DevicesSkeleton />}>
					<DevicesContent />
				</Suspense>
			</div>
		</>
	);
}

function DevicesContent() {
	const { data } = useDevices();
	const deleteDevice = useDeleteDevice();
	const deleteAllDevices = useDeleteAllDevices();

	const currentDeviceId = data.currentDeviceId;

	const handleDeleteDevice = async (deviceId: string) => {
		try {
			await deleteDevice.mutateAsync(deviceId);
			toast.success("Device removed successfully");
		} catch (error) {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to remove device",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		}
	};

	const handleDeleteAll = async () => {
		if (!currentDeviceId) {
			toast.error("Cannot identify current device");
			return;
		}

		try {
			await deleteAllDevices.mutateAsync(currentDeviceId);
			toast.success("All other devices have been removed");
		} catch (error) {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to remove devices",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		}
	};

	if (data.devices.length === 0) {
		return <EmptyState />;
	}

	return (
		<section className="w-full" aria-labelledby="devices-heading">
			<div className="flex items-center justify-between mb-4">
				<h2 id="devices-heading" className="text-lg font-medium">
					Active Devices
				</h2>
				<span className="text-sm text-muted-foreground">
					{data.devices.length} device{data.devices.length !== 1 ? "s" : ""}
				</span>
			</div>

			<DevicesTable
				devices={data.devices}
				currentDeviceId={currentDeviceId}
				onRemove={handleDeleteDevice}
				isPending={deleteDevice.isPending}
			/>

			<DangerZone
				onRemoveAll={handleDeleteAll}
				disabled={deleteAllDevices.isPending}
				deviceCount={data.devices.length}
			/>
		</section>
	);
}

function EmptyState() {
	return (
		<div
			className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10"
			role="status"
			aria-label="No devices registered"
		>
			<div className="p-3 rounded-full bg-muted/50 mb-3">
				<ComputerIcon
					className="size-6 text-muted-foreground"
					aria-hidden="true"
				/>
			</div>
			<p className="font-medium text-foreground">No Devices Yet</p>
			<p className="text-sm text-muted-foreground mt-1 max-w-xs">
				Add your first device by installing the VS Code extension or logging in
				from another browser.
			</p>
		</div>
	);
}

function DevicesSkeleton() {
	return (
		<div className="space-y-4" aria-label="Loading devices" role="status">
			{/* Header skeleton */}
			<div className="flex items-center justify-between mb-4">
				<div className="h-6 w-32 bg-muted-foreground/20 rounded animate-pulse" />
				<div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
			</div>

			{/* Table skeleton */}
			<div className="w-full devices-table-wrapper rounded-xl p-1 bg-muted/50">
				<table className="devices-table w-full">
					<thead>
						<tr className="bg-muted/50">
							<th className="px-4 py-3 text-left">
								<div className="h-4 w-16 bg-muted-foreground/20 rounded animate-pulse" />
							</th>
							<th className="px-4 py-3 text-left">
								<div className="h-4 w-14 bg-muted-foreground/20 rounded animate-pulse" />
							</th>
							<th className="px-4 py-3 text-left">
								<div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
							</th>
							<th className="px-4 py-3 text-left">
								<div className="h-4 w-14 bg-muted-foreground/20 rounded animate-pulse" />
							</th>
							<th className="px-4 py-3" />
						</tr>
					</thead>
					<tbody className="bg-background">
						{[1, 2, 3].map((i) => (
							<tr key={i}>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-lg bg-muted/50 animate-pulse" />
										<div className="space-y-2">
											<div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
											<div className="h-3 w-20 bg-muted-foreground/20 rounded animate-pulse" />
										</div>
									</div>
								</td>
								<td className="px-4 py-3">
									<div className="h-4 w-14 bg-muted-foreground/20 rounded animate-pulse" />
								</td>
								<td className="px-4 py-3">
									<div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
								</td>
								<td className="px-4 py-3">
									<div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
								</td>
								<td className="px-4 py-3">
									<div className="size-8 bg-muted-foreground/20 rounded animate-pulse ml-auto" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Danger zone skeleton */}
			<div className="mt-6 w-full p-1 rounded-xl bg-muted/50">
				<div className="rounded-lg bg-background border overflow-hidden">
					<div className="px-4 py-3 border-b bg-muted/30">
						<div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
					</div>
					<div className="px-4 py-3">
						<div className="space-y-2">
							<div className="h-4 w-40 bg-muted-foreground/20 rounded animate-pulse" />
							<div className="h-3 w-full max-w-md bg-muted-foreground/20 rounded animate-pulse" />
						</div>
					</div>
					<div className="px-4 py-3 border-t bg-muted/10">
						<div className="flex justify-between items-center">
							<div className="h-3 w-64 bg-muted-foreground/20 rounded animate-pulse" />
							<div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
