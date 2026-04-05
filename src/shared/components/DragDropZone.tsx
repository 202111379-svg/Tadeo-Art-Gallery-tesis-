import { useRef, type ChangeEvent, type ReactNode } from 'react';
import ImageIcon from '@mui/icons-material/Image';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface Props {
  icon?: ReactNode;
  message?: string;
  onLoadFiles: (file: File[]) => void;
}

export const DragDropZone = ({
  icon = <ImageIcon sx={{ fontSize: 80, color: 'grey' }} />,
  message = 'Arrastra o selecciona',
  onLoadFiles,
}: Props) => {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const onFileInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const { files } = target;

    if (!files || files.length === 0) return;

    onLoadFiles(Array.from(files));
  };

  return (
    <>
      <input
        ref={inputFileRef}
        name="file-chooser"
        type="file"
        multiple
        accept="image/*"
        onChange={onFileInputChange}
        style={{ display: 'none' }}
      />

      <Stack
        onClick={() => inputFileRef.current?.click()}
        sx={{
          alignItems: 'center',
          border: 'dashed grey',
          borderRadius: 5,
          cursor: 'pointer',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {icon}
        <div style={{ margin: 10 }}>
          <Typography>{message}</Typography>
        </div>
      </Stack>
    </>
  );
};
