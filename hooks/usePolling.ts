import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => Promise<boolean | void> | boolean | void,
  interval: number | null,
  active: boolean = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active || interval === null) return;

    let isMounted = true;

    const tick = async () => {
      if (!isMounted) return;
      try {
        const shouldStop = await savedCallback.current();
        if (shouldStop) return;
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const id = setInterval(tick, interval);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [interval, active]);
}
