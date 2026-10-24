import { useCallback, useState } from 'react';
import { SessionsApi } from '../api/sessionsApi';

// "Trouver un créneau" : disponibilités des invités et confirmation par l'organisateur
export function useSlotFinding() {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async <T,>(call: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await call();
    } catch (err: any) {
      throw new Error(err?.message || err?.error?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAvailability = useCallback(
    (sessionId: string, slotIds: string[]) => run(() => SessionsApi.setSlotAvailability(sessionId, slotIds)),
    [run]
  );

  const confirmSlot = useCallback(
    (sessionId: string, slotId: string) => run(() => SessionsApi.confirmSlot(sessionId, slotId)),
    [run]
  );

  return { isLoading, setAvailability, confirmSlot };
}
