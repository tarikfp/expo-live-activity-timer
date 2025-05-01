import { useCallback, useEffect, useRef, useState } from "react";

export type TimerState = "idle" | "active" | "paused" | "finished";

interface UseTimerOptions {
  initialElapsedTime?: number;
  onUpdate?: (elapsedTime: number) => void;
}

export interface UseTimerReturn {
  elapsedTime: number;
  formattedTime: string;
  state: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  isRunning: () => boolean;
  syncWithExternalTimer: (externalElapsedTime: number) => void;
}

export function useTimer({
  initialElapsedTime = 0,
  onUpdate,
}: UseTimerOptions = {}): UseTimerReturn {
  const [elapsedTime, setElapsedTime] = useState<number>(
    initialElapsedTime
  );
  const [state, setState] = useState<TimerState>("idle");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(Date.now());
  const isSyncingRef = useRef<boolean>(false);

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return [
      hours > 0 ? `${hours.toString().padStart(2, "0")}:` : "",
      `${minutes.toString().padStart(2, "0")}:`,
      seconds.toString().padStart(2, "0"),
    ].join("");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const updateTimer = useCallback(() => {
    if (!isSyncingRef.current) {
      setElapsedTime((prevElapsedTime) => {
        const newElapsedTime = prevElapsedTime + 1;
        if (onUpdate) {
          onUpdate(newElapsedTime);
        }
        return newElapsedTime;
      });
    }
  }, [onUpdate]);

  const syncWithExternalTimer = useCallback(
    (externalElapsedTime: number) => {
      isSyncingRef.current = true;

      setElapsedTime(externalElapsedTime);

      lastSyncRef.current = Date.now();

      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    },
    []
  );

  const start = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState("active");
    lastTimeRef.current = Date.now();

    timerRef.current = setInterval(updateTimer, 1000);
  }, [updateTimer]);

  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("paused");
  }, [state]);

  const resume = useCallback(() => {
    lastTimeRef.current = Date.now();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState("active");
    timerRef.current = setInterval(updateTimer, 1000);
  }, [state, updateTimer]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime(0);
    setState("idle");
  }, []);

  const isRunning = useCallback((): boolean => {
    return state === "active";
  }, [state]);

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    state,
    start,
    pause,
    resume,
    reset,
    isRunning,
    syncWithExternalTimer,
  };
}
