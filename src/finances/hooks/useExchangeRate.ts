import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';

const DEFAULT_RATE = 3.80;

const fetchRate = async (docPath: string): Promise<number> => {
  const snap = await getDoc(doc(FirebaseDB, docPath));
  return snap.exists() ? (snap.data().usdToPen ?? DEFAULT_RATE) : DEFAULT_RATE;
};

export const useExchangeRate = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();
  const qc = useQueryClient();

  const docPath = uid && activeSeason
    ? `${uid}/gallery/exchangeRates/${activeSeason.id}`
    : null;

  const { data: rate = DEFAULT_RATE } = useQuery({
    queryKey: ['exchangeRate', docPath],
    queryFn: () => fetchRate(docPath!),
    enabled: !!docPath,
    staleTime: 1000 * 60 * 30, // 30 minutos — el TC no cambia frecuentemente
    gcTime: 1000 * 60 * 60,
  });

  const updateRate = async (newRate: number) => {
    if (!docPath || newRate <= 0) return;
    await setDoc(doc(FirebaseDB, docPath), {
      usdToPen: newRate,
      updatedAt: new Date().toISOString(),
      seasonId: activeSeason?.id,
    });
    qc.setQueryData(['exchangeRate', docPath], newRate);
  };

  const toPEN = (amount: number, currency: 'PEN' | 'USD'): number =>
    currency === 'USD' ? amount * rate : amount;

  return { rate, isLoading: false, updateRate, toPEN };
};
