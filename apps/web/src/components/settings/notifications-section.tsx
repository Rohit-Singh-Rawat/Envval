import { Switch } from '@envval/ui/components/switch';
import { Label } from '@envval/ui/components/label';
import { useUpdateNotifications, type NotificationPreferences, type UserProfile } from '@/hooks/user/use-user';
import { toast } from 'sonner';
import { useState } from 'react';

interface NotificationsSectionProps {
	profile: UserProfile;
}

/**
 * Notifications section with toggle switches for email preferences.
 */
export function NotificationsSection({ profile }: NotificationsSectionProps) {
	const updateNotifications = useUpdateNotifications();
	const [loadingKey, setLoadingKey] = useState<keyof NotificationPreferences | null>(null);

	const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
		setLoadingKey(key);
		const newPreferences: NotificationPreferences = {
			...profile.notificationPreferences,
			[key]: value,
		};

		try {
			await updateNotifications.mutateAsync(newPreferences);
			toast.success('Notification preferences updated');
		} catch (error) {
			toast.error('Failed to update preferences');
		} finally {
			setLoadingKey(null);
		}
	};

	return (
		<div className="w-full p-1 rounded-xl bg-muted/50">
			<div className="rounded-lg bg-background border overflow-hidden">
				{/* Header */}
				<div className="px-4 py-3 border-b bg-muted/30">
					<h3 className="text-sm font-medium text-foreground">Notifications</h3>
				</div>

				{/* Body */}
				<div className="p-6 space-y-4">
					<p className="text-sm text-muted-foreground">
						Manage email notifications for important events
					</p>

					{/* New Repository */}
					<div className="flex items-center justify-between py-2">
						<div className="flex-1">
							<Label htmlFor="new-repo" className="cursor-pointer">
								New repository added
							</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								Get notified when a new repository is added to your account
							</p>
						</div>
						<Switch
							id="new-repo"
							checked={profile.notificationPreferences.newRepoAdded}
							onCheckedChange={(checked) => handleToggle('newRepoAdded', checked)}
							disabled={loadingKey !== null}
							loading={loadingKey === 'newRepoAdded'}
							aria-label="Toggle new repository notifications"
						/>
					</div>

					{/* New Device */}
					<div className="flex items-center justify-between py-2">
						<div className="flex-1">
							<Label htmlFor="new-device" className="cursor-pointer">
								New device login
							</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								Get notified when a new device accesses your account
							</p>
						</div>
						<Switch
							id="new-device"
							checked={profile.notificationPreferences.newDeviceLogin}
							onCheckedChange={(checked) => handleToggle('newDeviceLogin', checked)}
							disabled={loadingKey !== null}
							loading={loadingKey === 'newDeviceLogin'}
							aria-label="Toggle new device notifications"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
