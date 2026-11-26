import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useFocusedRefresh(
  refresh: () => Promise<unknown>,
  enabled = true,
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let active = true;
      let busy = false;
      const update = async () => {
        if (!active || busy || AppState.currentState !== 'active') return;
        busy = true;
        try {
          await refreshRef.current();
        } catch {
        } finally {
          busy = false;
        }
      };
      const interval = setInterval(() => {
        void update();
      }, 30_000);
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void update();
      });
      return () => {
        active = false;
        clearInterval(interval);
        subscription.remove();
      };
    }, [enabled]),
  );
}
