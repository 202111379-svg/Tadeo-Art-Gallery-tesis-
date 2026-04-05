import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import type { Sector } from '../types/items';

interface Props {
  onAddSector: (sector: Omit<Sector, 'id' | 'workers'>) => void;
}

export const SectorForm = ({ onAddSector }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSector({ name: name.trim(), description: description.trim() || undefined });
    setName('');
    setDescription('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Stack spacing={1.5}>
        <TextField
          label="Nombre del sector"
          size="small"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Descripción (opcional)"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!name.trim()}
        >
          Agregar Sector
        </Button>
      </Stack>
    </Box>
  );
};
