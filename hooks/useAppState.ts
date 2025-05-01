import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppState() {
  const currentState = AppState.currentState;
  const [appState, setAppState] =
    useState<AppStateStatus>(currentState);
  const [previousAppState, setPreviousAppState] =
    useState<AppStateStatus | null>(null);

  const appStateRef = useRef(currentState);

  useEffect(() => {
    function onChange(newState: AppStateStatus) {
      setPreviousAppState(appStateRef.current);
      appStateRef.current = newState;
      setAppState(newState);
    }

    const subscription = AppState.addEventListener(
      "change",
      onChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    currentAppState: appState,
    previousAppState,
  };
}
