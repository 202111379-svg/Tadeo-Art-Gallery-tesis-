import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { useCheckAuth } from '../hooks';
import { FullScreenLoading } from '../shared/components/FullScreenLoading';

const GalleryLayout = lazy(() =>
  import('../shared/layouts/GalleryLayout').then((module) => ({ default: module.GalleryLayout }))
);
const AuthLayout = lazy(() =>
  import('../auth/layouts/AuthLayout').then((module) => ({ default: module.AuthLayout }))
);
const LoginPage = lazy(() =>
  import('../auth/pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('../auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage }))
);
const ProjectsPage = lazy(() =>
  import('../projects/pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage }))
);
const ProjectsView = lazy(() =>
  import('../projects/views/ProjectsView').then((module) => ({ default: module.ProjectsView }))
);
const ProjectView = lazy(() =>
  import('../projects/views/ProjectView').then((module) => ({ default: module.ProjectView }))
);
const HealthProjectPage = lazy(() =>
  import('../projects/pages/health/HealthProjectPage').then((module) => ({ default: module.HealthProjectPage }))
);
const SchedulePage = lazy(() =>
  import('../schedule/pages/SchedulePage').then((module) => ({ default: module.SchedulePage }))
);
const ScheduleProjectsView = lazy(() =>
  import('../schedule/views/ScheduleProjectsView').then((module) => ({ default: module.ScheduleProjectsView }))
);
const CalendarView = lazy(() =>
  import('../schedule/views/CalendarView').then((module) => ({ default: module.CalendarView }))
);
const DistributionPage = lazy(() =>
  import('../distribution/pages/DistributionPage').then((module) => ({ default: module.DistributionPage }))
);
const ReportView = lazy(() =>
  import('../reports/views/ReportView').then((module) => ({ default: module.ReportView }))
);
const DashboardView = lazy(() =>
  import('../dashboard/view/DashBoardView').then((module) => ({ default: module.DashboardView }))
);
const FinancesPage = lazy(() =>
  import('../finances/pages/FinancesPage').then((module) => ({ default: module.FinancesPage }))
);
const SeasonsPage = lazy(() =>
  import('../seasons/pages/SeasonsPage').then((module) => ({ default: module.SeasonsPage }))
);

const routeFallback = (
  <FullScreenLoading
    backgroundColor="background.default"
    circularProgressColor="primary"
  />
);

export const AppRouter = () => {
  const status = useCheckAuth();

  if (status === 'checking') {
    return (
      <FullScreenLoading
        backgroundColor="primary.main"
        circularProgressColor="warning"
      />
    );
  }

  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        {status === 'authenticated' ? (
          // GalleryApp
          <Route path="/" element={<GalleryLayout />}>
            <Route index element={<Navigate to="/projects" />} />
            <Route path="projects" element={<ProjectsPage />}>
              <Route index element={<ProjectsView />} />
              <Route path=":projectId" element={<ProjectView />} />
              <Route path="health" element={<HealthProjectPage />} />
            </Route>

            <Route path="schedule" element={<SchedulePage />}>
              <Route index element={<ScheduleProjectsView />} />
              <Route path=":scheduleProjectId" element={<CalendarView />} />
            </Route>

            <Route path="distribution" element={<DistributionPage />} />

            <Route path="reports" element={<ReportView />} />

            <Route path="finances" element={<FinancesPage />} />

            <Route path="seasons" element={<SeasonsPage />} />

            <Route path="dashboard" element={<DashboardView />} />

            <Route path="/*" element={<Navigate to="/projects" />} />
          </Route>
        ) : (
          // Login y registro
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="/auth/login" />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
        )}
        <Route path="/*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </Suspense>
  );
};
