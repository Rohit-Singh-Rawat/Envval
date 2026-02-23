import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import client from "@/lib/api";
import { DEVICE_KEYS_DB_OPTIONS, DEVICE_KEYS_STORAGE } from "@/lib/constants";
import {
  exportKeyAsJWK,
  exportPublicKeyAsPem,
  generateKeyPair,
} from "@/utils/crypto";
import {
  deleteFromIndexedDB,
  getFromIndexedDB,
  saveToIndexedDB,
} from "@/utils/indexeddb";

export function useDeviceKeyMaterialRegistration() {
  const keyMaterialMutation = useMutation({
    mutationFn: async () => {
      const keyPair = await generateKeyPair();
      const privateKeyJwk = await exportKeyAsJWK(keyPair.privateKey);
      const publicKeyPem = await exportPublicKeyAsPem(keyPair.publicKey);

      const response = await client.api.auth.device["key-material"].$post({
        json: { publicKey: publicKeyPem },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(
          "error" in errorData ? errorData.error : "Request failed",
        );
      }

      const data = await response.json();

      if ("error" in data) {
        throw new Error(String(data.error));
      }

      await Promise.all([
        saveToIndexedDB(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.privateKey,
          privateKeyJwk,
        ),
        saveToIndexedDB(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.wrappedKeyMaterial,
          data.wrappedUserKey,
        ),
      ]);

      return { wrappedKeyMaterial: data.wrappedUserKey };
    },
  });

  const clearKeysMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        deleteFromIndexedDB(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.privateKey,
        ),
        deleteFromIndexedDB(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.wrappedKeyMaterial,
        ),
      ]);
    },
  });

  const getStoredKeyMaterial = useCallback(async (): Promise<string | null> => {
    try {
      return await getFromIndexedDB<string>(
        DEVICE_KEYS_DB_OPTIONS,
        DEVICE_KEYS_STORAGE.wrappedKeyMaterial,
      );
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
