import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';

import type { ProjectEvaluation } from '../types/incident';

interface Props {
  evaluation?: ProjectEvaluation;
  onChange: (evaluation: ProjectEvaluation) => void;
  onSaveImmediate?: (evaluation: ProjectEvaluation) => void; // guarda directo sin esperar el form
  readOnly?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muy deficiente',
  2: 'Deficiente',
  3: 'Aceptable',
  4: 'Bueno',
  5: 'Excelente',
};

export const ProjectEvaluationForm = ({ evaluation, onChange, onSaveImmediate, readOnly = false }: Props) => {
  const [goalAchieved, setGoalAchieved] = useState(evaluation?.goalAchieved ?? true);
  const [rating, setRating] = useState<number>(evaluation?.rating ?? 3);
  const [notes, setNotes] = useState(evaluation?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const ev: ProjectEvaluation = {
      goalAchieved,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      notes: notes.trim(),
      evaluatedAt: new Date().toISOString(),
    };
    onChange(ev);
    // Si hay callback de guardado inmediato, lo usa
    if (onSaveImmediate) {
      onSaveImmediate(ev);
    } else {
      // Si no, dispara el submit del formulario principal
      document.getElementById('project-form')?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <StarIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Evaluación final del proyecto
        </Typography>
      </Stack>

      {evaluation && readOnly ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {evaluation.goalAchieved
                ? <CheckCircleIcon color="success" fontSize="small" />
                : <CancelIcon color="error" fontSize="small" />
              }
              <Typography variant="body2">
                Objetivo: <strong>{evaluation.goalAchieved ? 'Cumplido' : 'No cumplido'}</strong>
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Rating value={evaluation.rating} readOnly size="small" />
              <Typography variant="caption" color="text.secondary">
                {RATING_LABELS[evaluation.rating]}
              </Typography>
            </Stack>
            {evaluation.notes && (
              <Typography variant="body2" color="text.secondary">
                {evaluation.notes}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              Evaluado el {new Date(evaluation.evaluatedAt).toLocaleDateString('es-PE')}
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={goalAchieved}
                onChange={(e) => setGoalAchieved(e.target.checked)}
                color="success"
                disabled={readOnly}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {goalAchieved
                  ? <CheckCircleIcon color="success" fontSize="small" />
                  : <CancelIcon color="error" fontSize="small" />
                }
                <Typography variant="body2">
                  {goalAchieved ? 'Objetivo cumplido' : 'Objetivo no cumplido'}
                </Typography>
              </Stack>
            }
          />

          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Calificación general del proyecto
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Rating
                value={rating}
                onChange={(_, v) => v && setRating(v)}
                readOnly={readOnly}
              />
              <Typography variant="caption" color="text.secondary">
                {RATING_LABELS[rating] ?? ''}
              </Typography>
            </Stack>
          </Box>

          <TextField
            label="Notas de cierre"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly}
            placeholder="Resumen del proyecto, logros, áreas de mejora para el siguiente evento..."
          />

          {!readOnly && (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saved ? '✓ Evaluación guardada' : 'Guardar evaluación'}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};
