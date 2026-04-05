import { Outlet } from 'react-router';
import { FinancesView } from '../views/FinancesView';

export const FinancesPage = () => {
  return (
    <>
      <FinancesView />
      <Outlet />
    </>
  );
};
