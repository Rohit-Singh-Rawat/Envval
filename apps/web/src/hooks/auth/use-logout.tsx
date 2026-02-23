import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useDeviceKeyMaterialRegistration } from "./use-device-key-material-registration";

export function useLogout() {
	const navigate = useNavigate();
	const { clearDeviceKeys } = useDeviceKeyMaterialRegistration();
	const [isLoading, setIsLoading] = useState(false);

	const logout = async () => {
		setIsLoading(true);
		try {
			// Best-effort: clear local keys first. On failure we still sign out
			// so the user is never left in a half-authenticated state.
			await clearDeviceKeys().catch(() => undefined);
			await authClient.signOut();
			await navigate({ to: "/" });
		} catch {
			// Logout errors are non-recoverable client-side; the session will
			// be invalid on the next request regardless.
		} finally {
			setIsLoading(false);
		}
	};

	return { logout, isLoading };
}
