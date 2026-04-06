import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';

const DEFAULT_RATE = 3.80; // Tipo de cambio por defecto USD → PEN

/**
 * Persiste el tipo de cambio USD→PEN en Firestore bajo:
 * {uid}/gallery/config/exchangeRate
 * Se guarda por temporada para mantener historial contable.
 */
export const useExchangeRate = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [isLoading, setIsLoading] = useState(true);

  const docPath = uid && activeSeason
    ? `${uid}/gallery/exchangeRates/${activeSeason.id}`
    : null;

  useEffect(() => {
    if (!docPath) { setIsLoading(false); return; }
    getDoc(doc(FirebaseDB, docPath))
      .then((snap) => {
        if (snap.exists()) setRate(snap.data().usdToPen ?? DEFAULT_RATE);
      })
      .finally(() => setIsLoading(false));
  }, [docPath]);

  const updateRate = async (newRate: number) => {
    if (!docPath || newRate <= 0) return;
    setRate(newRate);
    await setDoc(doc(FirebaseDB, docPath), {
      usdToPen: newRate,
      updatedAt: new Date().toISOString(),
      seasonId: activeSeason?.id,
    });
  };

  /** Convierte cualquier monto a PEN usando el TC actual */
  const toPEN = (amount: number, currency: 'PEN' | 'USD'): number =>
    currency === 'USD' ? amount * rate : amount;

  return { rate, isLoading, updateRate, toPEN };
};
