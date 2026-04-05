import type { ReactNode } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  avatarSx?: SxProps<Theme>;
}

export const StatCard = ({ title, value, icon, avatarSx }: Props) => (
  <Card sx={{ height: '100%', boxShadow: 3 }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ width: 56, height: 56, ...avatarSx }}>
          {icon}
        </Avatar>
        <Box>
          <Typography color="text.secondary" variant="subtitle2" textTransform="uppercase">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);
