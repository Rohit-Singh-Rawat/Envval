import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useNavigate } from '@tanstack/react-router';
import { useDeviceKeyMaterialRegistration } from './use-device-key-material-registration';

export function useLogout() {
	const navigate = useNavigate();
	const { clearDeviceKeys } = useDeviceKeyMaterialRegistration();
	const [isLoading, setIsLoading] = useState(false);

	const logout = async () => {
		setIsLoading(true);
		try {
			await clearDeviceKeys();
			await authClient.signOut();
			navigate({ to: '/' });
		} finally {
			setIsLoading(false);
		}
	};

	return { logout, isLoading };
}
