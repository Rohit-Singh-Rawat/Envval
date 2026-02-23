import { useCallback, useEffect, useRef, useState } from "react";

const TICK_MS = 1000;

export function useTimer(defaultSeconds = 30) {
	const [secondsLeft, setSecondsLeft] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const clear = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const start = useCallback(
		(seconds = defaultSeconds) => {
			clear();
			setSecondsLeft(seconds);
			setIsRunning(true);

			intervalRef.current = setInterval(() => {
				setSecondsLeft((prev) => {
					if (prev <= 1) {
						clear();
						setIsRunning(false);
						return 0;
					}

					return prev - 1;
				});
			}, TICK_MS);
		},
		[clear, defaultSeconds],
	);

	const reset = useCallback(() => {
		clear();
		setSecondsLeft(0);
		setIsRunning(false);
	}, [clear]);

	useEffect(() => reset, [reset]);

	return {
		secondsLeft,
		isRunning,
		start,
		reset,
	};
}
