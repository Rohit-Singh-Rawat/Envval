import type { AuthType } from "@envval/api/auth";
import {
  customSessionClient,
  deviceAuthorizationClient,
  emailOTPClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.VITE_API_BASE_URL,
  plugins: [
    customSessionClient<AuthType>(),
    deviceAuthorizationClient(),
    emailOTPClient(),
  ],
});

export const useSession = authClient.useSession;
