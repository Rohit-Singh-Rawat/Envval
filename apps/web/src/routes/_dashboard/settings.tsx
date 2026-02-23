import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { Heading } from "@/components/dashboard/shared/heading";
import { DangerZoneSection } from "@/components/settings/danger-zone-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { StatisticsSection } from "@/components/settings/statistics-section";
import { useUserProfile } from "@/hooks/user/use-user";

export const Route = createFileRoute("/_dashboard/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Heading
        title="Settings"
        description="Manage your account preferences and profile information"
      />

      <div className="flex-1">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </>
  );
}

function SettingsContent() {
  const { data: profile } = useUserProfile();

  return (
    <div className="space-y-6">
      <ProfileSection profile={profile} />
      <NotificationsSection profile={profile} />
      <StatisticsSection />
      <DangerZoneSection />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Skeleton */}
      <div className="w-full p-1 rounded-xl bg-muted/50">
        <div className="rounded-lg bg-background border overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="h-4 w-16 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-muted/50 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Other sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full p-1 rounded-xl bg-muted/50">
          <div className="rounded-lg bg-background border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
            <div className="p-6">
              <div className="h-20 w-full bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
