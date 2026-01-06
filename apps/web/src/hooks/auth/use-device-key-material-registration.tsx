import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { generateKeyPair, exportPublicKeyAsPem, exportKeyAsJWK } from '@/utils/crypto';
import { saveToIndexedDB, deleteFromIndexedDB, getFromIndexedDB } from '@/utils/indexeddb';
import { DEVICE_KEYS_DB, DEVICE_KEYS_STORAGE } from '@/lib/constants';
import client from '@/lib/api';

const DB_OPTIONS = {
	dbName: DEVICE_KEYS_DB.name,
	version: DEVICE_KEYS_DB.version,
	storeName: DEVICE_KEYS_DB.storeName,
	keyPath: DEVICE_KEYS_DB.keyPath,
} as const;

export function useDeviceKeyMaterialRegistration() {
	const keyMaterialMutation = useMutation({
		mutationFn: async () => {
			const keyPair = await generateKeyPair();
			const privateKeyJwk = await exportKeyAsJWK(keyPair.privateKey);
			const publicKeyPem = await exportPublicKeyAsPem(keyPair.publicKey);

			const response = await client.api.auth.device['key-material'].$post({
				json: { publicKey: publicKeyPem },
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
				throw new Error('error' in errorData ? errorData.error : 'Request failed');
			}

			const data = await response.json();

			if ('error' in data) {
				throw new Error(String(data.error));
			}

			await Promise.all([
				saveToIndexedDB(DB_OPTIONS, DEVICE_KEYS_STORAGE.privateKey, privateKeyJwk),
				saveToIndexedDB(DB_OPTIONS, DEVICE_KEYS_STORAGE.wrappedKeyMaterial, data.wrappedUserKey),
			]);

			return { wrappedKeyMaterial: data.wrappedUserKey };
		},
	});

	const clearKeysMutation = useMutation({
		mutationFn: async () => {
			await Promise.all([
				deleteFromIndexedDB(DB_OPTIONS, DEVICE_KEYS_STORAGE.privateKey),
				deleteFromIndexedDB(DB_OPTIONS, DEVICE_KEYS_STORAGE.wrappedKeyMaterial),
			]);
		},
	});

	const getStoredKeyMaterial = useCallback(async (): Promise<string | null> => {
		try {
			return await getFromIndexedDB<string>(DB_OPTIONS, DEVICE_KEYS_STORAGE.wrappedKeyMaterial);
		} catch {
			return null;
		}
	}, []);

	const registerDeviceAndFetchKeyMaterial = useCallback(() => {
		return keyMaterialMutation.mutateAsync();
	}, [keyMaterialMutation]);

	const clearDeviceKeys = useCallback(() => {
		return clearKeysMutation.mutateAsync();
	}, [clearKeysMutation]);

	return {
		registerDeviceAndFetchKeyMaterial,
		getStoredKeyMaterial,
		clearDeviceKeys,
		isLoading: keyMaterialMutation.isPending || clearKeysMutation.isPending,
		error: keyMaterialMutation.error || clearKeysMutation.error,
	};
}
