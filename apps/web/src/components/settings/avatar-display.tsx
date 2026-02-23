import { MarbleAvatar } from "@/components/ui/marble-avatar";
import { getAvatarById } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarProps {
	avatarId: string;
	className?: string;
	size?: "sm" | "md" | "lg";
}

const sizeMap = {
	sm: 32,
	md: 48,
	lg: 64,
};

/**
 * Displays a user avatar using marble patterns.
 */
export function Avatar({ avatarId, className, size = "md" }: AvatarProps) {
	const avatar = getAvatarById(avatarId);

	if (!avatar) {
		// Fallback to default pattern
		return (
			<MarbleAvatar
				name="default-0"
				size={sizeMap[size]}
				className={cn("rounded-full", className)}
			/>
		);
	}

	return (
		<MarbleAvatar
			name={`pattern-${avatar.pattern}`}
			size={sizeMap[size]}
			className={cn("rounded-full", className)}
		/>
	);
}
