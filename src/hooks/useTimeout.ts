import { useCallback, useEffect, useRef } from 'react';

// One pending action per owner. Repeated actions replace the previous timer.
export function useTimeout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    if (!mounted.current) return;
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      callback();
    }, delay);
  }, [cancel]);

  return { schedule, cancel };
}
