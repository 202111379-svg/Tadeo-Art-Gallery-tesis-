import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';

import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { Sector } from '../types/items';

interface Props {
  sectors: Sector[];
  selectedSectorId: string | null;
  onSelectSector: (id: string) => void;
  onDeleteSector: (id: string) => void;
}

export const SectorList = ({ sectors, selectedSectorId, onSelectSector, onDeleteSector }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingSector = sectors.find((s) => s.id === pendingId);

  if (sectors.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3, fontStyle: 'italic' }}>
        No hay sectores creados
      </Typography>
    );
  }

  return (
    <>
      <Stack spacing={1}>
        {sectors.map((sector) => {
          const isSelected = sector.id === selectedSectorId;
          return (
            <Paper
              key={sector.id}
              variant="outlined"
              onClick={() => onSelectSector(sector.id)}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                transition: 'all 0.15s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {sector.name}
                  </Typography>
                  {sector.description && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {sector.description}
                    </Typography>
                  )}
                  <Chip
                    icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${sector.workers.length} trabajador(es)`}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => { e.stopPropagation(); setPendingId(sector.id); }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <ConfirmDialog
        open={!!pendingId}
        title="Eliminar sector"
        description={`¿Eliminar el sector "${pendingSector?.name ?? ''}"? Se perderán todos sus trabajadores.`}
        onConfirm={() => { if (pendingId) onDeleteSector(pendingId); setPendingId(null); }}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
};
