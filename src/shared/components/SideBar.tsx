import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { CustomItem } from '../../types/custom-item';

import { SideBarItem } from './SideBarItem';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { toggleSideBar } from '../../store/ui';

interface Props {
  title?: string;
  items?: CustomItem[];
  drawerWidth?: number;
}

export const SideBar = ({ title = '', items, drawerWidth = 250 }: Props) => {
  const matches = useMediaQuery(({ breakpoints }) => breakpoints.up('md'));
  const { isSideBarOpen } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  const handleCloseSideBar = () => {
    dispatch(toggleSideBar());
  };

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
      <Drawer
        variant={matches ? 'permanent' : 'temporary'}
        open={matches || isSideBarOpen}
        onClose={handleCloseSideBar}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{ px: 2, py: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
              Usuario
            </Typography>
            <Typography variant="subtitle2" noWrap sx={{ color: 'white', fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
        </Toolbar>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

        <List>
          {items?.map((item) => (
            <SideBarItem
              key={item.path}
              onClick={handleCloseSideBar}
              {...item}
            />
          ))}
        </List>
      </Drawer>
    </Box>
  );
};
