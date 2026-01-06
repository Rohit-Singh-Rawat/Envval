import { useEffect, useRef } from 'react';
import { useDeviceKeyMaterialRegistration } from './use-device-key-material-registration';
import { useSession } from '@/lib/auth-client';
import { toastKeyMaterialSync } from '@/lib/toast';

export function useKeyMaterialSync() {
	const { data: session } = useSession();
	const { registerDeviceAndFetchKeyMaterial, getStoredKeyMaterial, isLoading } =
		useDeviceKeyMaterialRegistration();
	const syncAttemptedRef = useRef(false);

	useEffect(() => {
		if (!session?.user || syncAttemptedRef.current || isLoading) return;

		const sync = async () => {
			const existingKey = await getStoredKeyMaterial();
			if (existingKey) return;

			syncAttemptedRef.current = true;
			toastKeyMaterialSync(registerDeviceAndFetchKeyMaterial());
		};

		sync();
	}, [session?.user, getStoredKeyMaterial, registerDeviceAndFetchKeyMaterial, isLoading]);

	return { isLoading };
}
