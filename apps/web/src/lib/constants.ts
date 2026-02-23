import { env } from "@/env";

export const EXTENSION_URL = env.VITE_EXTENSION_URL;

export const DEVICE_KEYS_DB = {
  name: "device-auth-db",
  version: 1,
  storeName: "keys",
  keyPath: "id",
} as const;

/**
 * Pre-shaped options for every IndexedDB call targeting the device-keys store.
 * Single source of truth — avoids re-mapping DEVICE_KEYS_DB fields at each call site.
 */
export const DEVICE_KEYS_DB_OPTIONS = {
  dbName: DEVICE_KEYS_DB.name,
  version: DEVICE_KEYS_DB.version,
  storeName: DEVICE_KEYS_DB.storeName,
  keyPath: DEVICE_KEYS_DB.keyPath,
} as const;

export const DEVICE_KEYS_STORAGE = {
  privateKey: "device-private-key",
  wrappedKeyMaterial: "wrapped-key-material",
} as const;

export const TOAST_IDS = {
  keyMaterialSync: "key-material-sync",
} as const;
