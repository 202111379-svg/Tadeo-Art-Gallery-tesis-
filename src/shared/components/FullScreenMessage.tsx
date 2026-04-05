import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface Props {
  icon?: ReactNode;
  message: string;
}

export const FullScreenMessage = ({ icon, message }: Props) => {
  return (
    <Stack
      sx={{
        height: 'calc(100dvh - 112px)',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: 280, textAlign: 'center' }}>
        {icon}
        <Typography sx={{ fontSize: 20 }}>{message}</Typography>
      </Box>
    </Stack>
  );
};
