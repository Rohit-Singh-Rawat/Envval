import { useState, useEffect, useCallback } from 'react';
import { getFromIndexedDB } from '@/utils/indexeddb';
import { unwrapKeyMaterial, importPrivateKeyFromJWK } from '@/utils/crypto';
import { DEVICE_KEYS_DB, DEVICE_KEYS_STORAGE } from '@/lib/constants';
import { useSession } from '@/lib/auth-client';

const DB_OPTIONS = {
	dbName: DEVICE_KEYS_DB.name,
	version: DEVICE_KEYS_DB.version,
	storeName: DEVICE_KEYS_DB.storeName,
	keyPath: DEVICE_KEYS_DB.keyPath,
} as const;

interface KeyMaterialState {
	readonly keyMaterial: string | null;
	readonly isLoading: boolean;
	readonly error: Error | null;
}

/**
 * Manages retrieval and unwrapping of user's encryption key material.
 * Caches the unwrapped key material to avoid repeated crypto operations.
 * 
 * @returns Key material state with unwrapped key, loading, and error states
 */
export function useKeyMaterial() {
	const { data: session } = useSession();
	const userId = session?.user?.id ?? null;

	const [state, setState] = useState<KeyMaterialState>({
		keyMaterial: null,
		isLoading: true,
		error: null,
	});

	const unwrapAndCache = useCallback(async () => {
		try {
			setState(prev => ({ ...prev, isLoading: true, error: null }));

			const [wrappedKeyMaterial, privateKeyJwk] = await Promise.all([
				getFromIndexedDB<string>(DB_OPTIONS, DEVICE_KEYS_STORAGE.wrappedKeyMaterial),
				getFromIndexedDB<JsonWebKey>(DB_OPTIONS, DEVICE_KEYS_STORAGE.privateKey),
			]);

			if (!wrappedKeyMaterial || !privateKeyJwk) {
				throw new Error('Key material not found. Please re-authenticate your device.');
			}

			const privateKey = await importPrivateKeyFromJWK(privateKeyJwk);
			const unwrapped = await unwrapKeyMaterial(privateKey, wrappedKeyMaterial);

			setState({
				keyMaterial: unwrapped,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			setState({
				keyMaterial: null,
				isLoading: false,
				error: error instanceof Error ? error : new Error('Failed to retrieve key material'),
			});
		}
	}, []);

	useEffect(() => {
		if (userId) {
			unwrapAndCache();
		} else {
			setState({ keyMaterial: null, isLoading: false, error: null });
		}
	}, [userId, unwrapAndCache]);

	return {
		keyMaterial: state.keyMaterial,
		userId,
		isLoading: state.isLoading,
		error: state.error,
	};
}
