import { type MouseEventHandler, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import HideImageIcon from '@mui/icons-material/HideImage';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Link from '@mui/material/Link';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import LockIcon from '@mui/icons-material/Lock';

import { cropString } from '../../helpers';
import type { ProjectPhase, ProjectStatus } from '../types/project';
import { PHASE_LABELS, STATUS_LABELS } from '../types/project';

interface Props {
  images?: string[];
  isPosting?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  projectId: string;
  subtitle?: string;
  title: string;
  status?: ProjectStatus;
  phase?: ProjectPhase;
  onDelete?: () => void;
}

const STATUS_COLORS: Record<ProjectStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  on_hold: 'warning',
  closed: 'default',
};

export const ProjectItem = (props: Props) => {
  const { isPosting, projectId, title, subtitle, images = [], onClick, onDelete, status, phase } = props;

  const cropSubtitle = useMemo(() => subtitle ? cropString(subtitle, 400) : undefined, [subtitle]);
  const imageLimit = images.length >= 4 ? 4 : images.length;
  const columns = useMemo(() => imageLimit % 2 === 0 ? 2 : 3, [imageLimit]);
  const isClosed = status === 'closed';

  return (
    <ListItem
      divider
      disablePadding
      sx={{ opacity: isClosed ? 0.65 : 1 }}
      secondaryAction={
        <Tooltip title={isClosed ? 'Proyecto cerrado' : 'Eliminar proyecto'}>
          <span>
            <IconButton onClick={onDelete} disabled={isPosting || isClosed}>
              {isClosed ? <LockIcon color="disabled" /> : <DeleteIcon color="error" />}
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      <Link component={RouterLink} to={`/projects/${projectId}`} onClick={onClick} sx={{ width: '100%' }}>
        <ListItemButton sx={{ gap: 2 }} alignItems="flex-start" disableRipple>
          <ListItemAvatar>
            <Avatar
              sx={{ width: 200, height: 200, backgroundColor: 'action.hover', color: 'text.secondary' }}
              variant="rounded"
            >
              {imageLimit === 0 ? (
                <Stack sx={{ alignItems: 'center' }}>
                  <HideImageIcon sx={{ fontSize: 50 }} />
                  <Typography sx={{ fontSize: 20 }}>Sin imágenes</Typography>
                </Stack>
              ) : (
                <ImageList cols={columns} gap={0} sx={{ height: '100%', overflow: 'hidden' }}>
                  {images.slice(0, imageLimit).map((image, i) => (
                    <ImageListItem key={image}>
                      <img alt={`Imagen ${i + 1}`} loading="lazy" src={image}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Avatar>
          </ListItemAvatar>

          <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.5}>
            <Typography sx={{ fontSize: 22, fontWeight: 600 }} noWrap>{title}</Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {status && (
                <Chip
                  size="small"
                  label={STATUS_LABELS[status]}
                  color={STATUS_COLORS[status]}
                  icon={status === 'on_hold' ? <PauseCircleIcon /> : status === 'closed' ? <LockIcon /> : undefined}
                  variant={status === 'active' ? 'filled' : 'outlined'}
                />
              )}
              {phase && (
                <Chip size="small" label={PHASE_LABELS[phase]} variant="outlined" color="primary" />
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {cropSubtitle || 'Sin descripción'}
            </Typography>
          </Stack>
        </ListItemButton>
      </Link>
    </ListItem>
  );
};
