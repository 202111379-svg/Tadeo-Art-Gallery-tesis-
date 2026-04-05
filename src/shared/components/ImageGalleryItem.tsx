import type { MouseEvent } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import ImageListItem from '@mui/material/ImageListItem';

interface Props {
  image: string;
  alt: string;
  onDelete?: (event: MouseEvent) => void;
}

export const ImageGalleryItem = ({ image, alt, onDelete }: Props) => {
  return (
    <ImageListItem sx={{ position: 'relative' }}>
      <img
        src={image}
        alt={alt}
        loading="lazy"
        style={{
          borderRadius: 8,
          height: '100%',
          objectFit: 'cover',
          width: '100%',
        }}
      />

      <IconButton
        onClick={onDelete}
        disableRipple
        color="error"
        sx={{
          backdropFilter: 'blur(4px)',
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          position: 'absolute',
          right: 4,
          top: 4,
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </ImageListItem>
  );
};
