import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { toastKeyMaterialSync } from "@/lib/toast";
import { useDeviceKeyMaterialRegistration } from "./use-device-key-material-registration";

export function useKeyMaterialSync() {
	const { data: session } = useSession();
	const { registerDeviceAndFetchKeyMaterial, getStoredKeyMaterial, isLoading } =
		useDeviceKeyMaterialRegistration();
	const syncAttemptedRef = useRef(false);

	useEffect(() => {
		if (!session?.user || syncAttemptedRef.current || isLoading) return;

		const sync = async () => {
			// Set synchronously before the first await so a concurrent invocation
			// (React StrictMode double-effect) sees the guard and exits immediately.
			syncAttemptedRef.current = true;

			const existingKey = await getStoredKeyMaterial();
			if (existingKey) return;

			toastKeyMaterialSync(registerDeviceAndFetchKeyMaterial());
		};

		void sync();
	}, [
		session?.user,
		getStoredKeyMaterial,
		registerDeviceAndFetchKeyMaterial,
		isLoading,
	]);

	return { isLoading };
}
