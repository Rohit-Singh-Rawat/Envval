type UiSoundId =
	| "button"
	| "toast-notification"
	| "toast-caution"
	| "toggle-on"
	| "toggle-off";

type PlaySoundOptions = {
	volume?: number;
};

const SOUND_SOURCES: Record<UiSoundId, string> = {
	button: "/sounds/ui/button.wav",
	"toast-notification": "/sounds/ui/notification.wav",
	"toast-caution": "/sounds/ui/caution.wav",
	"toggle-on": "/sounds/ui/toggle_on.wav",
	"toggle-off": "/sounds/ui/toggle_off.wav",
};

const audioCache = new Map<UiSoundId, HTMLAudioElement>();

/**
 * Play a short UI sound effect from a small in-memory audio pool.
 * Centralizes audio handling so individual components stay clean and declarative.
 */
export function playUiSound(id: UiSoundId, options?: PlaySoundOptions): void {
	if (typeof window === "undefined") return;

	const src = SOUND_SOURCES[id];
	if (!src) return;

	let audio = audioCache.get(id);

	if (!audio) {
		audio = new Audio(src);
		audio.preload = "auto";
		audioCache.set(id, audio);
	}

	if (typeof options?.volume === "number") {
		audio.volume = options.volume;
	}

	try {
		audio.currentTime = 0;
	} catch {
		// If the audio element is not ready, let it play from the current position.
	}

	void audio.play().catch(() => {
		// Swallow playback errors (e.g. autoplay restrictions) to avoid breaking UX.
	});
}

export type { UiSoundId, PlaySoundOptions };
