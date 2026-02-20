import { env } from '@/env';

export const EXTENSION_URL = env.VITE_EXTENSION_URL;

export const DEVICE_KEYS_DB = {
	name: 'device-auth-db',
	version: 1,
	storeName: 'keys',
	keyPath: 'id',
} as const;

export const DEVICE_KEYS_STORAGE = {
	privateKey: 'device-private-key',
	wrappedKeyMaterial: 'wrapped-key-material',
} as const;

export const TOAST_IDS = {
	keyMaterialSync: 'key-material-sync',
} as const;
