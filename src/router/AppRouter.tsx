import { Routes, Route, Navigate } from 'react-router';

import { useCheckAuth } from '../hooks';
import { FullScreenLoading } from '../shared/components/FullScreenLoading';
import { GalleryLayout } from '../shared/layouts';
import { AuthLayout, LoginPage, RegisterPage } from '../auth';
import { HealthProjectPage, ProjectsPage } from '../projects/pages';
import { DistributionPage } from '../distribution/pages';
import { ProjectsView, ProjectView } from '../projects/views';
import { SchedulePage } from '../schedule/pages';
import { CalendarView, ScheduleProjectsView } from '../schedule/views';
import { ReportView } from '../reports/views/ReportView';
import { DashboardView } from '../dashboard/view/DashBoardView';
import { FinancesPage } from '../finances/pages/FinancesPage';
import { SeasonsPage } from '../seasons/pages/SeasonsPage';

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
  );
};
