import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PaletteIcon from '@mui/icons-material/Palette';
import { Outlet } from 'react-router';

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Panel izquierdo — branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(145deg, #1A1033 0%, #3D1A78 50%, #7C3AED 100%)',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos */}
        <Box sx={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)',
          top: -100, left: -100,
        }} />
        <Box sx={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
          bottom: -80, right: -80,
        }} />
        <Box sx={{
          position: 'absolute', width: 200, height: 200,
          borderRadius: '50%', bgcolor: 'rgba(124,58,237,0.15)',
          top: '40%', right: '10%',
        }} />

        <Stack alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 80, height: 80,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <PaletteIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ color: 'white', textAlign: 'center', lineHeight: 1.2 }}
          >
            Tadeo Art Gallery
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 320 }}
          >
            Gestiona tus exposiciones, proyectos artísticos, personal y finanzas en un solo lugar.
          </Typography>

          {/* Puntos decorativos */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {['Proyectos', 'Cronograma', 'Finanzas'].map((label) => (
              <Box
                key={label}
                sx={{
                  px: 2, py: 0.75,
                  borderRadius: 10,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Panel derecho — formulario */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: 'background.paper',
        }}
      >
        {/* Logo móvil */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 5, display: { md: 'none' } }}>
          <PaletteIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} color="primary">
            Tadeo Art Gallery
          </Typography>
        </Stack>

        <Box className="animate__animated animate__fadeIn animate__faster">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
