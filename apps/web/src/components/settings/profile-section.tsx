import { Button } from "@envval/ui/components/button";
import { Input } from "@envval/ui/components/input";
import { Label } from "@envval/ui/components/label";
import { Edit02Icon } from "hugeicons-react";
import { useState } from "react";
import { type UserProfile, useUpdateProfile } from "@/hooks/user/use-user";
import type { AvatarId } from "@/lib/avatars";
import { normalizeClientError } from "@/lib/error";
import { toast } from "@/lib/toast";
import { Avatar } from "./avatar-display";
import { AvatarPicker } from "./avatar-picker";

interface ProfileSectionProps {
  profile: UserProfile;
}

export function ProfileSection({ profile }: ProfileSectionProps) {
  const [displayName, setDisplayName] = useState(
    profile.displayName || profile.name,
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const updateProfile = useUpdateProfile();

  const hasChanges = displayName !== (profile.displayName || profile.name);

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      await updateProfile.mutateAsync({ displayName: displayName.trim() });
      toast.success("Profile updated");
    } catch (error) {
      const { message, kind } = normalizeClientError(
        error,
        "Failed to update profile",
      );
      const showToast = kind === "rate_limit" ? toast.warning : toast.error;
      showToast(message);
    }
  };

  const handleAvatarSelect = async (avatarId: AvatarId) => {
    try {
      await updateProfile.mutateAsync({ avatar: avatarId });
      toast.success("Avatar updated");
    } catch (error) {
      const { message, kind } = normalizeClientError(
        error,
        "Failed to update avatar",
      );
      const showToast = kind === "rate_limit" ? toast.warning : toast.error;
      showToast(message);
    }
  };

  const createdDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="w-full p-1 rounded-xl bg-muted/50">
        <div className="rounded-lg bg-background border overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-medium text-foreground">Profile</h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar avatarId={profile.avatar} size="lg" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Profile Picture
                </p>
                <p className="text-xs text-muted-foreground">
                  Choose from available avatars
                </p>
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
              <p
                id="displayName-hint"
                className="text-xs text-muted-foreground"
              >
                This is how your name will appear across the app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                readOnly
                disabled
                aria-readonly="true"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

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
