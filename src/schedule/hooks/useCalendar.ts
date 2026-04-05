import { useState } from 'react';
import type { View } from 'react-big-calendar';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';

export const useCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [lastView, setLastView] = useState<View>(
    (localStorage.getItem('lastView') as View) || 'week'
  );

  const dispatch = useAppDispatch();
  const { events } = useAppSelector((state) => state.schedule);
  const user = useAppSelector((state) => state.auth);

  const onViewChanged = (lastView: View) => {
    localStorage.setItem('lastView', lastView);
    setLastView(lastView);
  };

  const onNavigate = (newDate: Date) => setDate(newDate);

  return {
    //* Props
    date,
    events,
    lastView,
    user,

    //* Methods
    dispatch,
    onNavigate,
    onViewChanged,
  };
};
