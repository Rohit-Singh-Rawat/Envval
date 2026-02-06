import { useState, useEffect } from 'react';
import { deriveKey, decryptEnv, CryptoError } from '@/utils/crypto-env';
import { useKeyMaterial } from '@/hooks/auth/use-key-material';

interface DecryptionState {
	readonly decryptedContent: string | null;
	readonly isDecrypting: boolean;
	readonly error: Error | null;
}

interface UseEnvDecryptParams {
	readonly encryptedContent: string | undefined;
	readonly enabled?: boolean;
}

/**
 * Decrypts environment file content using AES-256-GCM.
 * Automatically derives encryption key and performs decryption when enabled.
 * 
 * @param encryptedContent - Encrypted content in format "ciphertext.authTag:iv"
 * @param enabled - Whether decryption should run (default: true)
 * @returns Decryption state with plaintext content, loading, and error states
 */
export function useEnvDecrypt({ encryptedContent, enabled = true }: UseEnvDecryptParams) {
	const { keyMaterial, userId, isLoading: isLoadingKeyMaterial, error: keyMaterialError } = useKeyMaterial();
	
	const [state, setState] = useState<DecryptionState>({
		decryptedContent: null,
		isDecrypting: false,
		error: null,
	});

	useEffect(() => {
		if (!enabled || !encryptedContent) {
			setState({ decryptedContent: null, isDecrypting: false, error: null });
			return;
		}

		if (keyMaterialError) {
			setState({
				decryptedContent: null,
				isDecrypting: false,
				error: keyMaterialError,
			});
			return;
		}

		if (isLoadingKeyMaterial || !keyMaterial || !userId) {
			setState(prev => ({ ...prev, isDecrypting: true, error: null }));
			return;
		}

		let cancelled = false;

		const performDecryption = async () => {
			try {
				setState(prev => ({ ...prev, isDecrypting: true, error: null }));

				const encryptionKey = await deriveKey(keyMaterial, userId);
				const plaintext = await decryptEnv(encryptedContent, encryptionKey);

				if (!cancelled) {
					setState({
						decryptedContent: plaintext,
						isDecrypting: false,
						error: null,
					});
				}
			} catch (error) {
				if (!cancelled) {
					setState({
						decryptedContent: null,
						isDecrypting: false,
						error: error instanceof CryptoError
							? error
							: new Error('Failed to decrypt environment content'),
					});
				}
			}
		};

		performDecryption();

		return () => {
			cancelled = true;
		};
	}, [encryptedContent, keyMaterial, userId, isLoadingKeyMaterial, keyMaterialError, enabled]);

	return {
		decryptedContent: state.decryptedContent,
		isDecrypting: state.isDecrypting || isLoadingKeyMaterial,
		error: state.error,
	};
}
