import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAppSelector } from '../../store/reduxHooks';
import {
  getSeasonsAction,
  createSeasonAction,
  closeSeasonAction,
} from '../actions/seasons.action';
import { getDonorsAction } from '../../finances/actions/donors.action';
import { getExpensesAction } from '../../finances/actions/expenses.action';
import { getProjectsAction } from '../../projects/actions/get-projects.action';
import { getSectorsAction } from '../../distribution/actions/distribution.action';
import type { Season } from '../types/season';

interface SeasonContextType {
  activeSeason: Season | null;
  seasons: Season[];
  isLoading: boolean;
  createSeason: (name: string, description?: string) => Promise<void>;
  closeSeason: () => Promise<void>;
}

const SeasonContext = createContext<SeasonContextType>({
  activeSeason: null,
  seasons: [],
  isLoading: true,
  createSeason: async () => {},
  closeSeason: async () => {},
});

export const useSeasonContext = () => useContext(SeasonContext);

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const { uid } = useAppSelector((s) => s.auth);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeSeason = seasons.find((s) => s.status === 'active') ?? null;

  const load = useCallback(async () => {
    if (!uid) { setIsLoading(false); return; }
    try {
      const data = await getSeasonsAction(uid);
      setSeasons(data);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const createSeason = async (name: string, description?: string) => {
    if (!uid) return;
    // Construir objeto limpio sin campos undefined (Firestore los rechaza)
    const seasonData: Omit<Season, 'id'> = {
      name,
      startDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    if (description) seasonData.description = description;

    const newSeason = await createSeasonAction(uid, seasonData);
    setSeasons((prev) => [newSeason, ...prev]);
  };

  const closeSeason = async () => {
    if (!uid || !activeSeason) return;

    // Snapshot filtrado por la temporada que se está cerrando
    const [donors, expenses, projects, sectors] = await Promise.all([
      getDonorsAction(uid, activeSeason.id),
      getExpensesAction(uid, activeSeason.id),
      getProjectsAction(uid, activeSeason.id),
      getSectorsAction(uid),  // sectores no tienen seasonId propio, se cuentan todos
    ]);

    const totalWorkers = sectors.reduce((acc, s) => acc + s.workers.length, 0);

    const summary: Season['closingSummary'] = {
      totalIncomePEN: donors.filter((d) => d.currency === 'PEN').reduce((a, d) => a + d.amount, 0),
      totalIncomeUSD: donors.filter((d) => d.currency === 'USD').reduce((a, d) => a + d.amount, 0),
      totalExpensePEN: expenses.filter((e) => e.currency === 'PEN').reduce((a, e) => a + e.amount, 0),
      totalExpenseUSD: expenses.filter((e) => e.currency === 'USD').reduce((a, e) => a + e.amount, 0),
      totalProjects: projects.length,
      totalWorkers,
      closedAt: new Date().toISOString(),
    };

    await closeSeasonAction(uid, activeSeason.id, summary);
    setSeasons((prev) =>
      prev.map((s) =>
        s.id === activeSeason.id
          ? { ...s, status: 'closed', endDate: new Date().toISOString(), closingSummary: summary }
          : s
      )
    );
  };

  return (
    <SeasonContext.Provider value={{ activeSeason, seasons, isLoading, createSeason, closeSeason }}>
      {children}
    </SeasonContext.Provider>
  );
};
