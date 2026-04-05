import { type MouseEventHandler, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Avatar from '@mui/material/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
import HideImageIcon from '@mui/icons-material/HideImage';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Link from '@mui/material/Link';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { cropString } from '../../helpers';

interface Props {
  images?: string[];
  isPosting?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  projectId: string;
  subtitle?: string;
  title: string;
  onDelete?: () => void;
}

export const ProjectItem = (props: Props) => {
  const {
    isPosting,
    projectId,
    title,
    subtitle,
    images = [],
    onClick,
    onDelete,
  } = props;

  const cropSubtitle = useMemo(() => {
    if (subtitle) {
      return cropString(subtitle, 400);
    }
  }, [subtitle]);

  const imageLimit = images.length >= 4 ? 4 : images.length;

  const columns = useMemo(() => {
    return imageLimit % 2 === 0 ? 2 : 3;
  }, [imageLimit]);

  return (
    <ListItem
      divider
      disablePadding
      secondaryAction={
        <Tooltip title="Eliminar proyecto">
          <IconButton onClick={onDelete} disabled={isPosting}>
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip>
      }
    >
      <Link
        component={RouterLink}
        to={`/projects/${projectId}`}
        onClick={onClick}
        sx={{ width: '100%' }}
      >
        <ListItemButton sx={{ gap: 2 }} alignItems="flex-start" disableRipple>
          {/* It create a image grid for project images */}
          <ListItemAvatar>
            <Avatar
              sx={{
                width: 200,
                height: 200,
                backgroundColor: 'action.hover',
                color: 'text.secondary',
              }}
              variant="rounded"
            >
              {imageLimit === 0 ? (
                <Stack sx={{ alignItems: 'center' }}>
                  <HideImageIcon sx={{ fontSize: 50 }} />
                  <Typography sx={{ fontSize: 20 }}>Sin imágenes</Typography>
                </Stack>
              ) : (
                <ImageList
                  cols={columns}
                  gap={0}
                  sx={{ height: '100%', overflow: 'hidden' }}
                >
                  {images.slice(0, imageLimit).map((image, i) => (
                    <ImageListItem key={image}>
                      <img
                        alt={`Imagen ${i + 1} del proyecto ${title}`}
                        loading="lazy"
                        src={image}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={title}
            secondary={cropSubtitle || 'Sin descripción'}
            slotProps={{ primary: { sx: { marginBottom: 1, fontSize: 25 } } }}
          />
        </ListItemButton>
      </Link>
    </ListItem>
  );
};
