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
import { computeProjectHealthFull } from '../../helpers/project-health';
import type { Season, SeasonClosingSummary } from '../types/season';

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

    const [donors, expenses, projects, sectors] = await Promise.all([
      getDonorsAction(uid, activeSeason.id),
      getExpensesAction(uid, activeSeason.id),
      getProjectsAction(uid, activeSeason.id),
      getSectorsAction(uid, activeSeason.id),
    ]);

    // ── Financiero ──────────────────────────────────────────────────────────
    const totalIncomePEN  = donors.filter((d) => d.currency === 'PEN').reduce((a, d) => a + d.amount, 0);
    const totalIncomeUSD  = donors.filter((d) => d.currency === 'USD').reduce((a, d) => a + d.amount, 0);
    const totalExpensePEN = expenses.filter((e) => e.currency === 'PEN').reduce((a, e) => a + e.amount, 0);
    const totalExpenseUSD = expenses.filter((e) => e.currency === 'USD').reduce((a, e) => a + e.amount, 0);

    // ── Proyectos ───────────────────────────────────────────────────────────
    const healthResults = projects.map((p) => computeProjectHealthFull(p));
    const healthyProjects    = healthResults.filter((r) => r.score >= 75).length;
    const attentionProjects  = healthResults.filter((r) => r.score >= 45 && r.score < 75).length;
    const criticalProjects   = healthResults.filter((r) => r.score < 45).length;

    const evaluated = projects.filter((p) => !!p.evaluation);
    const projectsGoalAchieved = evaluated.filter((p) => p.evaluation!.goalAchieved).length;
    const avgRating = evaluated.length > 0
      ? Math.round((evaluated.reduce((a, p) => a + p.evaluation!.rating, 0) / evaluated.length) * 10) / 10
      : null;

    // ── Incidencias ─────────────────────────────────────────────────────────
    const allIncidents = projects.flatMap((p) => p.incidents ?? []);
    const highImpactIncidents = allIncidents.filter((i) => i.impact === 'high').length;
    const topLessons = allIncidents
      .filter((i) => i.lesson?.trim())
      .sort((a, b) => (b.impact === 'high' ? 1 : 0) - (a.impact === 'high' ? 1 : 0))
      .slice(0, 3)
      .map((i) => i.lesson);

    // ── Personal ────────────────────────────────────────────────────────────
    const totalWorkers = sectors.reduce((acc, s) => acc + s.workers.length, 0);

    // ── Logística ───────────────────────────────────────────────────────────
    const venues = [...new Set(
      projects
        .map((p) => p.logistics?.venue?.name?.trim())
        .filter(Boolean) as string[]
    )];
    const totalArtists  = projects.reduce((a, p) => a + (p.logistics?.artists?.length ?? 0), 0);
    const totalCapacity = projects.reduce((a, p) => a + (p.logistics?.capacity ?? 0), 0);

    const summary: SeasonClosingSummary = {
      totalIncomePEN,
      totalIncomeUSD,
      totalExpensePEN,
      totalExpenseUSD,
      balancePEN: totalIncomePEN - totalExpensePEN,
      totalProjects: projects.length,
      healthyProjects,
      attentionProjects,
      criticalProjects,
      projectsGoalAchieved,
      avgRating,
      totalIncidents: allIncidents.length,
      highImpactIncidents,
      topLessons,
      totalWorkers,
      venues,
      totalArtists,
      totalCapacity,
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
