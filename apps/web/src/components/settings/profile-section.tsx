import { useState } from 'react';
import { Button } from '@envval/ui/components/button';
import { Input } from '@envval/ui/components/input';
import { Label } from '@envval/ui/components/label';
import { Avatar } from './avatar-display';
import { AvatarPicker } from './avatar-picker';
import { useUpdateProfile, type UserProfile } from '@/hooks/user/use-user';
import { toast } from '@/lib/toast';
import { Edit02Icon } from 'hugeicons-react';

interface ProfileSectionProps {
	profile: UserProfile;
}

/**
 * Profile section with editable display name and avatar selector.
 */
export function ProfileSection({ profile }: ProfileSectionProps) {
	const [displayName, setDisplayName] = useState(profile.displayName || profile.name);
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
	const updateProfile = useUpdateProfile();

	const hasChanges = displayName !== (profile.displayName || profile.name);

	const handleUpdateName = async () => {
		if (!displayName.trim()) {
			toast.error('Display name cannot be empty');
			return;
		}

		try {
			await updateProfile.mutateAsync({ displayName: displayName.trim() });
			toast.success('Profile updated');
		} catch (error) {
			toast.error('Failed to update profile');
		}
	};

	const handleAvatarSelect = async (avatarId: string) => {
		try {
			await updateProfile.mutateAsync({
				avatar: avatarId as
					| 'avatar-1'
					| 'avatar-2'
					| 'avatar-3'
					| 'avatar-4'
					| 'avatar-5'
					| 'avatar-6'
					| 'avatar-7'
					| 'avatar-8'
					| 'avatar-9'
					| 'avatar-10',
			});
			toast.success('Avatar updated');
		} catch (error) {
			toast.error('Failed to update avatar');
		}
	};

	const createdDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

	return (
		<>
			<div className="w-full p-1 rounded-xl bg-muted/50">
				<div className="rounded-lg bg-background border overflow-hidden">
					{/* Header */}
					<div className="px-4 py-3 border-b bg-muted/30">
						<h3 className="text-sm font-medium text-foreground">Profile</h3>
					</div>

					{/* Body */}
					<div className="p-6 space-y-6">
						{/* Avatar */}
						<div className="flex items-center gap-4">
							<Avatar avatarId={profile.avatar} size="lg" />
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">Profile Picture</p>
								<p className="text-xs text-muted-foreground">Choose from available avatars</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowAvatarPicker(true)}
								disabled={updateProfile.isPending}
							>
								<Edit02Icon className="size-4" aria-hidden="true" />
								Change
							</Button>
						</div>

						{/* Display Name */}
						<div className="space-y-2">
							<Label htmlFor="displayName">Display Name</Label>
							<div className="flex gap-2">
								<Input
									id="displayName"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									maxLength={50}
									disabled={updateProfile.isPending}
									aria-describedby="displayName-hint"
								/>
								<Button
									onClick={handleUpdateName}
									disabled={!hasChanges || updateProfile.isPending}
									pending={updateProfile.isPending}
	>
									Save
								</Button>
							</div>
							<p id="displayName-hint" className="text-xs text-muted-foreground">
								This is how your name will appear across the app
							</p>
						</div>

						{/* Email (Read-only) */}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" value={profile.email} readOnly disabled aria-readonly="true" />
							<p className="text-xs text-muted-foreground">Email cannot be changed</p>
						</div>

						{/* Member Since */}
						<div className="space-y-2">
							<Label>Member Since</Label>
							<p className="text-sm text-muted-foreground">{createdDate}</p>
						</div>
					</div>
				</div>
			</div>

			<AvatarPicker
				currentAvatarId={profile.avatar}
				onSelect={handleAvatarSelect}
				open={showAvatarPicker}
				onOpenChange={setShowAvatarPicker}
			/>
		</>
	);
}
