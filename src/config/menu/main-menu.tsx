import type { CustomItem } from '../../types/custom-item';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/Book';
import Favorite from '@mui/icons-material/Favorite';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventNoteIcon from '@mui/icons-material/EventNote';

export const mainMenu: CustomItem[] = [
  {
    path: '/projects',
    title: 'Proyectos',
    icon: <BookIcon />,
  },
  {
    path: '/projects/health',
    title: 'Salud proyectos',
    icon: <Favorite />,
  },
  {
    path: '/schedule',
    title: 'Cronograma',
    icon: <ScheduleIcon />,
  },
  {
    path: '/distribution',
    title: 'Distribución',
    icon: <PeopleIcon />,
  },
  {
    path: '/reports',
    title: 'Reportes',
    icon: <BookIcon />,
  },
  {
    path: '/finances',
    title: 'Finanzas',
    icon: <AttachMoneyIcon />,
  },
  {
    path: '/seasons',
    title: 'Temporadas',
    icon: <EventNoteIcon />,
  },
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: <BarChartIcon />,
  },
];
