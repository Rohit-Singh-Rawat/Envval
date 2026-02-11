import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { TOAST_IDS } from './constants';
import { playUiSound } from './sound';

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

type ToastKind = 'success' | 'error' | 'warning' | 'info';

const TOAST_SOUND_MAP: Record<ToastKind, 'toast-notification' | 'toast-caution'> = {
	success: 'toast-notification',
	info: 'toast-notification',
	warning: 'toast-caution',
	error: 'toast-caution',
};

function playToastSound(kind: ToastKind): void {
	const soundId = TOAST_SOUND_MAP[kind];
	// Toast notification sounds are intentionally quieter so they don't dominate UX.
	playUiSound(soundId, { volume: 0.5 });
}

/**
 * Thin wrapper around `sonner`'s toast helpers that adds consistent UI sounds.
 * Keep this as the single surface for toast calls in the web app.
 */
export const toast = {
	success: (...args: Parameters<typeof sonnerToast.success>) => {
		playToastSound('success');
		return sonnerToast.success(...args);
	},
	error: (...args: Parameters<typeof sonnerToast.error>) => {
		playToastSound('error');
		return sonnerToast.error(...args);
	},
	warning: (...args: Parameters<typeof sonnerToast.warning>) => {
		playToastSound('warning');
		return sonnerToast.warning(...args);
	},
	info: (...args: Parameters<typeof sonnerToast.info>) => {
		playToastSound('info');
		return sonnerToast.info(...args);
	},
};

export function toastKeyMaterialSync<T>(
	promise: Promise<T>,
	options?: ExternalToast
): Promise<T> {
	const withSound = promise
		.then((value) => {
			playToastSound('success');
			return value;
		})
		.catch((error) => {
			playToastSound('error');
			throw error;
		});

	sonnerToast.promise(withSound, {
		id: TOAST_IDS.keyMaterialSync,
		...KEY_MATERIAL_MESSAGES,
		...options,
	});

	return withSound;
}

