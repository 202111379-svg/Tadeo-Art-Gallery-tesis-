import type { MouseEventHandler } from 'react';
import { NavLink, useLocation } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import type { CustomItem } from '../../types/custom-item';

interface Props extends CustomItem {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export const SideBarItem = ({
  icon,
  onClick,
  path,
  subtitle,
  title,
}: Props) => {
  const { pathname } = useLocation();
  const isActive = pathname === path;

  return (
    <Link component={NavLink} to={path} onClick={onClick}>
      <ListItem
        divider={false}
        className="animate__animated animate__fadeIn"
        disablePadding
        sx={{ mb: 0.5 }}
      >
        <ListItemButton selected={isActive}>
          <ListItemAvatar>
            <Avatar
              sx={{
                backgroundColor: isActive
                  ? 'rgba(167,139,250,0.35)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                width: 36,
                height: 36,
              }}
            >
              {icon}
            </Avatar>
          </ListItemAvatar>

          <Grid>
            <ListItemText
              primary={title}
              slotProps={{
                primary: {
                  sx: {
                    color: 'white',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                  },
                },
              }}
            />
            {subtitle && (
              <ListItemText
                secondary={subtitle}
                slotProps={{
                  secondary: { sx: { color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' } },
                }}
              />
            )}
          </Grid>
        </ListItemButton>
      </ListItem>
    </Link>
  );
};
