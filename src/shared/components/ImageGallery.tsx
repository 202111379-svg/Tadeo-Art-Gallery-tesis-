import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { ImageGalleryItem } from './ImageGalleryItem';
import { DragDropZone } from './DragDropZone';

interface Props {
  images?: string[];
  addNewImages?: (files: File[]) => void;
  onDeleteImage?: (index: number) => void;
}

export const ImageGallery = ({ addNewImages, images = [], onDeleteImage }: Props) => {
  const onLoadFiles = (files: File[]) => {
    if (addNewImages) addNewImages(files);
  };

  const handleDelete = (index: number) => {
    if (onDeleteImage) onDeleteImage(index);
  };

  return images.length > 0 ? (
    <ImageList
      sx={{ width: '100%', height: 500 }}
      cols={4}
      rowHeight={240}
      gap={5}
    >
      {images.map((image, i) => (
        <ImageGalleryItem
          key={i}
          image={image}
          alt={`Image ${i}`}
          onDelete={() => handleDelete(i)}
        />
      ))}

      <ImageListItem>
        <DragDropZone
          icon={<AddIcon sx={{ fontSize: 50, color: 'grey' }} />}
          message="Arrastra o selecciona para añadir más"
          onLoadFiles={onLoadFiles}
        />
      </ImageListItem>
    </ImageList>
  ) : (
    <Box sx={{ height: 500 }}>
      <DragDropZone
        message="Añade imagenes a tu proyecto"
        onLoadFiles={onLoadFiles}
      />
    </Box>
  );
};
