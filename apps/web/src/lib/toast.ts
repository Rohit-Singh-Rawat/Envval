import { toast, type ExternalToast } from 'sonner';
import { TOAST_IDS } from './constants';

type ToastMessages = {
	loading: string;
	success: string;
	error: string;
};

const KEY_MATERIAL_MESSAGES: ToastMessages = {
	loading: 'Securing your session...',
	success: 'Session secured!',
	error: 'Failed to secure session. Some features may be limited.',
};

export function toastKeyMaterialSync<T>(
	promise: Promise<T>,
	options?: ExternalToast
): Promise<T> {
	toast.promise(promise, {
		id: TOAST_IDS.keyMaterialSync,
		...KEY_MATERIAL_MESSAGES,
		...options,
	});
	return promise;
}

