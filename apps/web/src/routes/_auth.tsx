import { createFileRoute, Outlet } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
  redirectIfAuthenticatedGuard,
  redirectIfAuthenticatedMiddleware,
} from "@/middleware/auth";

export const Route = createFileRoute("/_auth")({
  server: {
    middleware: [redirectIfAuthenticatedMiddleware],
  },
  beforeLoad: async () => {
    // Client-side guard (server is already protected by middleware)
    if (typeof window === "undefined") return;
    const { data: session } = await authClient.getSession();
    redirectIfAuthenticatedGuard(session);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
