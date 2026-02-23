import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { DEVICE_KEYS_DB_OPTIONS, DEVICE_KEYS_STORAGE } from "@/lib/constants";
import { importPrivateKeyFromJWK, unwrapKeyMaterial } from "@/utils/crypto";
import { getFromIndexedDB } from "@/utils/indexeddb";

interface KeyMaterialState {
  readonly keyMaterial: string | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

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
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [wrappedKeyMaterial, privateKeyJwk] = await Promise.all([
        getFromIndexedDB<string>(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.wrappedKeyMaterial,
        ),
        getFromIndexedDB<JsonWebKey>(
          DEVICE_KEYS_DB_OPTIONS,
          DEVICE_KEYS_STORAGE.privateKey,
        ),
      ]);

      if (!wrappedKeyMaterial || !privateKeyJwk) {
        throw new Error(
          "Key material not found. Please re-authenticate your device.",
        );
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
        error:
          error instanceof Error
            ? error
            : new Error("Failed to retrieve key material"),
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
