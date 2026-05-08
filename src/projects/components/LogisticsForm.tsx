import { useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import BrushIcon from '@mui/icons-material/Brush';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { fileUpload } from '../../helpers';
import type { ProjectLogistics, EventArtist } from '../types/logistics';

interface Props {
  value: ProjectLogistics;
  onChange: (logistics: ProjectLogistics) => void;
  disabled?: boolean;
}

export const LogisticsForm = ({ value, onChange, disabled = false }: Props) => {
  const [newSector, setNewSector] = useState('');
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistDiscipline, setNewArtistDiscipline] = useState('');
  const [newArtistContact, setNewArtistContact] = useState('');
  const [venueEvidenceUrl, setVenueEvidenceUrl] = useState('');
  const [uploadingVenueEvidence, setUploadingVenueEvidence] = useState(false);
  const [venueEvidenceError, setVenueEvidenceError] = useState<string | null>(null);
  const [mapQuery, setMapQuery] = useState(value.venue?.name ?? '');
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string | null>(
    value.venue?.name
      ? `https://maps.google.com/maps?q=${encodeURIComponent(value.venue.name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : null
  );
  const venueEvidenceCount = value.venue?.evidenceUrls?.length ?? 0;
  const venueIsConfirmed = !!value.venue?.confirmed && venueEvidenceCount > 0;

  const update = (partial: Partial<ProjectLogistics>) =>
    onChange({ ...value, ...partial });

  const updateVenue = (partial: Partial<NonNullable<ProjectLogistics['venue']>>) =>
    update({ venue: { ...value.venue, name: value.venue?.name ?? '', ...partial } });

  const confirmVenueWithEvidence = (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    updateVenue({
      evidenceUrls: [...(value.venue?.evidenceUrls ?? []), cleanUrl],
      confirmed: true,
      confirmedAt: value.venue?.confirmedAt ?? new Date().toISOString(),
    });
  };

  const addVenueEvidenceUrl = () => {
    confirmVenueWithEvidence(venueEvidenceUrl);
    setVenueEvidenceUrl('');
    setVenueEvidenceError(null);
  };

  const uploadVenueEvidence = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingVenueEvidence(true);
    setVenueEvidenceError(null);
    try {
      const url = await fileUpload(file);
      confirmVenueWithEvidence(url);
    } catch (error) {
      setVenueEvidenceError(
        error instanceof Error ? error.message : 'No se pudo subir la evidencia del local'
      );
    } finally {
      setUploadingVenueEvidence(false);
    }
  };

  const removeVenueEvidence = (urlToRemove: string) => {
    const evidenceUrls = (value.venue?.evidenceUrls ?? []).filter((url) => url !== urlToRemove);
    updateVenue({
      evidenceUrls,
      confirmed: evidenceUrls.length > 0 ? value.venue?.confirmed : false,
      confirmedAt: evidenceUrls.length > 0 ? value.venue?.confirmedAt : undefined,
    });
  };

  // ── Mapa embed (sin API key) ────────────────────────────────────────────────
  const embedMap = () => {
    const q = mapQuery.trim();
    if (!q) return;
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    const mapsUrl  = `https://maps.google.com/?q=${encodeURIComponent(q)}`;
    setMapEmbedUrl(embedUrl);
    // Guardar nombre del lugar Y link directo a Google Maps
    updateVenue({ name: q, mapsUrl });
  };

  const clearMap = () => {
    setMapEmbedUrl(null);
    setMapQuery('');
    updateVenue({ name: '' });
  };

  const addSector = () => {
    if (!newSector.trim()) return;
    update({ sectors: [...(value.sectors ?? []), newSector.trim()] });
    setNewSector('');
  };

  const removeSector = (index: number) =>
    update({ sectors: (value.sectors ?? []).filter((_, i) => i !== index) });

  const [newArtistSector, setNewArtistSector] = useState('');

  const addArtist = () => {
    if (!newArtistName.trim()) return;
    const artist: EventArtist = {
      name: newArtistName.trim(),
      discipline: newArtistDiscipline.trim() || undefined,
      contact: newArtistContact.trim() || undefined,
      sector: newArtistSector.trim() || undefined,
    };
    update({ artists: [...(value.artists ?? []), artist] });
    setNewArtistName('');
    setNewArtistDiscipline('');
    setNewArtistContact('');
    setNewArtistSector('');
  };

  const removeArtist = (index: number) =>
    update({ artists: (value.artists ?? []).filter((_, i) => i !== index) });

  return (
    <Stack spacing={3}>

      {/* ── Lugar del evento ── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <LocationOnIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Lugar del evento
          </Typography>
        </Stack>

        {/* Buscador de mapa */}
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Escribe el nombre o dirección del lugar y presiona "Ver mapa" para confirmar la ubicación. Se guardará automáticamente.
        </Typography>
        <Stack direction="row" spacing={1} mb={2}>
          <TextField
            label="Nombre del lugar o dirección"
            fullWidth
            size="small"
            disabled={disabled}
            placeholder="Ej: Parque de la amistad, Lima"
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); embedMap(); } }}
            helperText={mapEmbedUrl ? '✓ Ubicación confirmada y guardada' : 'Presiona Enter o "Ver mapa" para confirmar'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MapIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={embedMap}
            disabled={disabled || !mapQuery.trim()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Ver mapa
          </Button>
          {mapEmbedUrl && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearMap}
              disabled={disabled}
            >
              Limpiar
            </Button>
          )}
        </Stack>

        {/* Mapa embed */}
        {mapEmbedUrl && (
          <>
            <Box
              sx={{
                width: '100%',
                height: 300,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            >
              <iframe
                title="Mapa del evento"
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>

            {/* Botón abrir en Google Maps */}
            {value.venue?.mapsUrl && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MapIcon />}
                  href={value.venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  component="a"
                >
                  Abrir en Google Maps
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Datos adicionales del lugar */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Dirección completa"
              fullWidth
              size="small"
              disabled={disabled}
              placeholder="Av. Principal 123"
              value={value.venue?.address ?? ''}
              onChange={(e) => updateVenue({ address: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Ciudad"
              fullWidth
              size="small"
              disabled={disabled}
              value={value.venue?.city ?? ''}
              onChange={(e) => updateVenue({ city: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="País"
              fullWidth
              size="small"
              disabled={disabled}
              value={value.venue?.country ?? ''}
              onChange={(e) => updateVenue({ country: e.target.value })}
            />
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Confirmacion documental del local
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sube aqui el permiso municipal o documento que confirme el uso del local.
                </Typography>
              </Box>
              <Chip
                size="small"
                label={venueIsConfirmed ? 'Local confirmado' : 'Pendiente'}
                color={venueIsConfirmed ? 'success' : 'default'}
                variant={venueIsConfirmed ? 'filled' : 'outlined'}
              />
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value.venue?.confirmed}
                  disabled={disabled}
                  onChange={(event) =>
                    updateVenue({
                      confirmed: event.target.checked,
                      confirmedAt: event.target.checked
                        ? value.venue?.confirmedAt ?? new Date().toISOString()
                        : undefined,
                    })
                  }
                />
              }
              label="Local confirmado"
            />
            {value.venue?.confirmed && venueEvidenceCount === 0 && (
              <Typography variant="caption" color="warning.main">
                La confirmacion queda pendiente hasta adjuntar al menos una evidencia del local.
              </Typography>
            )}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button
                component="label"
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={disabled || uploadingVenueEvidence}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {uploadingVenueEvidence ? 'Subiendo...' : 'Subir permiso'}
                <input hidden type="file" accept="image/*,.pdf" onChange={uploadVenueEvidence} />
              </Button>
              <TextField
                label="URL de evidencia"
                size="small"
                fullWidth
                disabled={disabled}
                value={venueEvidenceUrl}
                onChange={(event) => setVenueEvidenceUrl(event.target.value)}
                placeholder="Pega aqui un enlace si ya tienes el archivo"
              />
              <Button
                variant="outlined"
                onClick={addVenueEvidenceUrl}
                disabled={disabled || !venueEvidenceUrl.trim()}
              >
                Adjuntar
              </Button>
            </Stack>

            {venueEvidenceError && (
              <Typography variant="caption" color="error">
                {venueEvidenceError}
              </Typography>
            )}

            {(value.venue?.evidenceUrls ?? []).length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {(value.venue?.evidenceUrls ?? []).map((url, index) => (
                  <Stack
                    key={url}
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5 }}
                  >
                    <Button
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      endIcon={<OpenInNewIcon fontSize="small" />}
                    >
                      Evidencia {index + 1}
                    </Button>
                    {!disabled && (
                      <IconButton size="small" color="error" onClick={() => removeVenueEvidence(url)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}

            <TextField
              label="Notas de confirmacion"
              fullWidth
              multiline
              rows={2}
              size="small"
              disabled={disabled}
              value={value.venue?.evidenceNotes ?? ''}
              onChange={(event) => updateVenue({ evidenceNotes: event.target.value || undefined })}
              placeholder="Ej: permiso municipal aprobado, contrato de alquiler, constancia del local..."
            />
          </Stack>
        </Paper>
      </Box>

      <Divider />

      {/* ── Aforo y asistentes ── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <PeopleIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Capacidad y asistencia
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Aforo máximo"
              type="number"
              fullWidth
              size="small"
              disabled={disabled}
              inputProps={{ min: 0 }}
              placeholder="Ej: 500"
              value={value.capacity ?? ''}
              onChange={(e) =>
                update({ capacity: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Asistentes esperados"
              type="number"
              fullWidth
              size="small"
              disabled={disabled}
              inputProps={{ min: 0 }}
              placeholder="Ej: 350"
              value={value.expectedAttendees ?? ''}
              onChange={(e) =>
                update({ expectedAttendees: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* ── Sectores del evento ── */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Sectores del evento
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Ej: Sala principal, Entrada, Área VIP, Cafetería, Almacén
        </Typography>

        {(value.sectors ?? []).length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
            {(value.sectors ?? []).map((sector, i) => (
              <Chip
                key={i}
                label={sector}
                onDelete={disabled ? undefined : () => removeSector(i)}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        <Stack direction="row" spacing={1}>
          <TextField
            label="Nuevo sector"
            size="small"
            disabled={disabled}
            value={newSector}
            onChange={(e) => setNewSector(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSector(); } }}
            placeholder="Nombre del sector"
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSector}
            disabled={disabled || !newSector.trim()}
          >
            Agregar
          </Button>
        </Stack>
      </Box>

      <Divider />

      {/* ── Artistas ── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <BrushIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Expositores y artistas invitados
          </Typography>
        </Stack>

        {(value.artists ?? []).length > 0 && (
          <Stack spacing={1} mb={2}>
            {(value.artists ?? []).map((artist, i) => (
              <Paper key={i} variant="outlined" sx={{ px: 2, py: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{artist.name}</Typography>
                    <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                      {artist.discipline && (
                        <Chip label={artist.discipline} size="small" variant="outlined" />
                      )}
                      {artist.sector && (
                        <Chip label={`📍 ${artist.sector}`} size="small" color="primary" variant="outlined" />
                      )}
                      {artist.contact && (
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                          {artist.contact}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <IconButton size="small" color="error" disabled={disabled} onClick={() => removeArtist(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Nombre del artista"
              size="small"
              fullWidth
              disabled={disabled}
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              label="Disciplina"
              size="small"
              fullWidth
              disabled={disabled}
              value={newArtistDiscipline}
              onChange={(e) => setNewArtistDiscipline(e.target.value)}
              placeholder="Pintura, escultura..."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              label="Sector asignado"
              size="small"
              fullWidth
              disabled={disabled}
              value={newArtistSector}
              onChange={(e) => setNewArtistSector(e.target.value)}
              helperText="¿En qué sector expone?"
            >
              <MenuItem value="">Sin sector específico</MenuItem>
              {(value.sectors ?? []).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              label="Contacto (opcional)"
              size="small"
              fullWidth
              disabled={disabled}
              value={newArtistContact}
              onChange={(e) => setNewArtistContact(e.target.value)}
              placeholder="correo o teléfono"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={addArtist}
              disabled={disabled || !newArtistName.trim()}
            >
              Agregar
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* ── Requerimientos técnicos y notas ── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Requerimientos técnicos"
            fullWidth
            multiline
            rows={3}
            size="small"
            disabled={disabled}
            placeholder="Iluminación especial, sistema de sonido, proyectores..."
            value={value.technicalRequirements ?? ''}
            onChange={(e) => update({ technicalRequirements: e.target.value || undefined })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Notas adicionales"
            fullWidth
            multiline
            rows={3}
            size="small"
            disabled={disabled}
            placeholder="Cualquier información relevante para la logística..."
            value={value.notes ?? ''}
            onChange={(e) => update({ notes: e.target.value || undefined })}
          />
        </Grid>
      </Grid>

    </Stack>
  );
};
