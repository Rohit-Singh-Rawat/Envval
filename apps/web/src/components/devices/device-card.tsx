import { Button } from "@envval/ui/components/button";
import {
	ResponsiveAlert,
	ResponsiveAlertContent,
	ResponsiveAlertFooter,
	ResponsiveAlertHeader,
	ResponsiveAlertTitle,
} from "@envval/ui/components/responsive-alert";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	CheckmarkCircle02Icon,
	ChromeIcon,
	ComputerIcon,
	Delete01Icon,
} from "hugeicons-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Device } from "@/hooks/devices/use-devices";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Device>();

interface DevicesTableProps {
	devices: Device[];
	currentDeviceId: string | null;
	onRemove: (deviceId: string) => void;
	isPending: boolean;
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${day}/${month}/${year}`;
}

function getDeviceIcon(type: Device["type"]) {
	return type === "DEVICE_EXTENSION" ? ComputerIcon : ChromeIcon;
}

function parseUserAgent(userAgent: string | null): string {
	if (!userAgent) return "Unknown";

	if (userAgent.includes("Windows")) return "Windows";
	if (userAgent.includes("Macintosh")) return "macOS";
	if (userAgent.includes("Linux")) return "Linux";
	if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
	if (userAgent.includes("Android")) return "Android";

	return "Unknown OS";
}

function getDeviceDisplayName(device: Device): string {
	const os = parseUserAgent(device.lastUserAgent);
	const deviceType =
		device.type === "DEVICE_EXTENSION" ? "VS Code" : "Web Browser";
	return device.name || `${deviceType} on ${os}`;
}

function getDeviceStatus(lastSeenAt: string): { label: string; color: string } {
	const lastSeen = new Date(lastSeenAt);
	const now = new Date();
	const daysSinceActive = Math.floor(
		(now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (daysSinceActive < 7) {
		return { label: "Active", color: "text-emerald-600 dark:text-emerald-500" };
	}
	return { label: "Inactive", color: "text-amber-600 dark:text-amber-500" };
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="pointer-events-none ml-1.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
			{children}
		</kbd>
	);
}

interface RemoveDeviceDialogProps {
	device: Device | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending: boolean;
}

function RemoveDeviceDialog({
	device,
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: RemoveDeviceDialogProps) {
	if (!device) return null;
	const deviceName = getDeviceDisplayName(device);

	return (
		<ResponsiveAlert open={open} onOpenChange={onOpenChange}>
			<ResponsiveAlertContent>
				<ResponsiveAlertHeader>
					<ResponsiveAlertTitle>Remove Device Access?</ResponsiveAlertTitle>
				</ResponsiveAlertHeader>

				<div className="mt-1 space-y-3">
					<p className="text-sm text-muted-foreground">
						Are you sure you want to remove access for{" "}
						<strong className="font-semibold text-foreground">
							"{deviceName}"
						</strong>
						?
					</p>
					<p className="text-sm font-medium text-destructive">
						This device will need to re-authenticate to access your environment
						variables.
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
						Remove Access
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

// Mobile card view for small screens
function DeviceCard({
	device,
	currentDeviceId,
	onRemove,
	isPending,
}: {
	device: Device;
	currentDeviceId: string | null;
	onRemove: (device: Device) => void;
	isPending: boolean;
}) {
	const Icon = getDeviceIcon(device.type);
	const displayName = getDeviceDisplayName(device);
	const isCurrentDevice = device.id === currentDeviceId;
	const deviceType =
		device.type === "DEVICE_EXTENSION" ? "VS Code" : "Web Browser";
	const status = getDeviceStatus(device.lastSeenAt);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="bg-background rounded-lg p-4 space-y-3"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0 flex-1">
					<div className="p-2 rounded-lg bg-muted/50 shrink-0">
						<Icon className="size-4 text-muted-foreground" aria-hidden="true" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<span
								className="font-normal text-foreground truncate max-w-[180px]"
								title={displayName}
							>
								{displayName}
							</span>
							{isCurrentDevice && (
								<span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
									<CheckmarkCircle02Icon
										className="size-3"
										aria-hidden="true"
									/>
									Current
								</span>
							)}
						</div>
						<p className="text-xs text-muted-foreground">{deviceType}</p>
					</div>
				</div>
				{!isCurrentDevice && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => onRemove(device)}
						disabled={isPending}
						className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
						aria-label={`Remove ${displayName}`}
					>
						<Delete01Icon className="size-4" aria-hidden="true" />
					</Button>
				)}
			</div>
			<div className="flex items-center gap-4 text-sm">
				<div className="flex items-center gap-1.5">
					<span className="text-muted-foreground">Status:</span>
					<span className={cn("font-medium", status.color)}>
						{status.label}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="text-muted-foreground">Last active:</span>
					<span className="text-foreground">
						{formatDate(device.lastSeenAt)}
					</span>
				</div>
			</div>
		</motion.div>
	);
}

export function DevicesTable({
	devices,
	currentDeviceId,
	onRemove,
	isPending,
}: DevicesTableProps) {
	const [deviceToRemove, setDeviceToRemove] = useState<Device | null>(null);

	const handleRemoveClick = (device: Device) => {
		setDeviceToRemove(device);
	};

	const handleConfirmRemove = () => {
		if (deviceToRemove) {
			onRemove(deviceToRemove.id);
			setDeviceToRemove(null);
		}
	};

	const columns = [
		columnHelper.accessor("name", {
			header: "Device",
			cell: (info) => {
				const device = info.row.original;
				const Icon = getDeviceIcon(device.type);
				const displayName = getDeviceDisplayName(device);
				const isCurrentDevice = device.id === currentDeviceId;
				const deviceType =
					device.type === "DEVICE_EXTENSION" ? "VS Code" : "Web Browser";

				return (
					<div className="flex items-center gap-3 py-1">
						<div className="p-2 rounded-lg bg-muted/50 shrink-0">
							<Icon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span
									className="font-normal text-foreground truncate max-w-[200px]"
									title={displayName}
								>
									{displayName}
								</span>
								{isCurrentDevice && (
									<span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
										<CheckmarkCircle02Icon
											className="size-3"
											aria-hidden="true"
										/>
										Current
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground">{deviceType}</p>
						</div>
					</div>
				);
			},
		}),
		columnHelper.accessor("lastSeenAt", {
			header: "Status",
			cell: (info) => {
				const status = getDeviceStatus(info.getValue());
				return (
					<span className={cn("text-sm font-medium", status.color)}>
						{status.label}
					</span>
				);
			},
		}),
		columnHelper.accessor("lastSeenAt", {
			id: "lastActive",
			header: "Last Active",
			cell: (info) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(info.getValue())}
				</span>
			),
		}),
		columnHelper.accessor("createdAt", {
			header: "Added",
			cell: (info) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(info.getValue())}
				</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			cell: (info) => {
				const device = info.row.original;
				const isCurrentDevice = device.id === currentDeviceId;

				// Don't allow removing current device
				if (isCurrentDevice) return null;

				return (
					<div className="flex justify-end">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => handleRemoveClick(device)}
							disabled={isPending}
							className="text-muted-foreground hover:text-destructive transition-colors"
							aria-label={`Remove ${getDeviceDisplayName(device)}`}
						>
							<Delete01Icon className="size-4" aria-hidden="true" />
						</Button>
					</div>
				);
			},
		}),
	];

	const table = useReactTable({
		data: devices,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<>
			{/* Mobile view - card layout */}
			<div className="md:hidden w-full space-y-2 rounded-xl p-1 bg-muted/50">
				{devices.map((device) => (
					<DeviceCard
						key={device.id}
						device={device}
						currentDeviceId={currentDeviceId}
						onRemove={handleRemoveClick}
						isPending={isPending}
					/>
				))}
			</div>

			{/* Desktop view - table layout */}
			<div className="hidden md:block w-full devices-table-wrapper rounded-xl p-1 bg-muted/50">
				<table className="devices-table w-full" aria-label="Devices list">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="bg-muted/50">
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										scope="col"
										className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="bg-background">
						{table.getRowModel().rows.map((row) => (
							<motion.tr
								key={row.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="hover:bg-muted/20 transition-colors"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			<RemoveDeviceDialog
				device={deviceToRemove}
				open={!!deviceToRemove}
				onOpenChange={(open) => !open && setDeviceToRemove(null)}
				onConfirm={handleConfirmRemove}
				isPending={isPending}
			/>
		</>
	);
}
