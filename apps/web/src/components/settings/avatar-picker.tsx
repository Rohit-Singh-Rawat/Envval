import { Button } from "@envval/ui/components/button";
import {
	ResponsiveAlert,
	ResponsiveAlertContent,
	ResponsiveAlertFooter,
	ResponsiveAlertHeader,
	ResponsiveAlertTitle,
} from "@envval/ui/components/responsive-alert";
import { CheckmarkCircle02Icon } from "hugeicons-react";
import { useState } from "react";
import { MarbleAvatar } from "@/components/ui/marble-avatar";
import { AVATAR_OPTIONS, type AvatarId } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
	currentAvatarId: AvatarId;
	onSelect: (avatarId: AvatarId) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AvatarPicker({
	currentAvatarId,
	onSelect,
	open,
	onOpenChange,
}: AvatarPickerProps) {
	const [selectedId, setSelectedId] = useState<AvatarId>(currentAvatarId);

	const handleConfirm = () => {
		onSelect(selectedId);
		onOpenChange(false);
	};

	return (
		<ResponsiveAlert open={open} onOpenChange={onOpenChange}>
			<ResponsiveAlertContent className="max-w-md">
				<ResponsiveAlertHeader>
					<ResponsiveAlertTitle>Choose Avatar</ResponsiveAlertTitle>
				</ResponsiveAlertHeader>

				<div className="mt-4 grid grid-cols-5 gap-3">
					{AVATAR_OPTIONS.map((avatar) => {
						const isSelected = avatar.id === selectedId;

						return (
							<button
								key={avatar.id}
								type="button"
								onClick={() => setSelectedId(avatar.id)}
								className={cn(
									"relative rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
									isSelected && "ring-2 ring-primary ring-offset-2",
								)}
								aria-label={`Select ${avatar.label} avatar`}
								aria-pressed={isSelected}
								title={avatar.label}
							>
								<MarbleAvatar
									name={`pattern-${avatar.pattern}`}
									size={64}
									className="rounded-full"
								/>
								{isSelected && (
									<div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
										<CheckmarkCircle02Icon
											className="size-4 text-white"
											aria-hidden={true}
										/>
									</div>
								)}
							</button>
						);
					})}
				</div>
				<ResponsiveAlertFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Confirm</Button>
				</ResponsiveAlertFooter>
			</ResponsiveAlertContent>
		</ResponsiveAlert>
	);
}
