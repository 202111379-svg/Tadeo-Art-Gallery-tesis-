import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type Props = TextFieldProps & {
  title: string;
};

export const EditableTypography = ({
  title,
  defaultValue,
  ...inputProps
}: Props) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleEditingTitle = () => {
    setIsEditingTitle(true);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const { value } = event.target;

    if (value.length === 0) return;

    setIsEditingTitle(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();

      const input = event.target as HTMLInputElement;
      if (input.value.length === 0) return;

      setIsEditingTitle(false);
    }
  };

  if (isEditingTitle) {
    return (
      <TextField
        {...inputProps}
        autoFocus
        defaultValue={defaultValue}
        onBlur={handleBlur}
        slotProps={{
          input: {
            style: { fontSize: 20 },
            onKeyDown: handleKeyDown,
          },
        }}
      />
    );
  }

  return (
    <Typography
      onClick={handleEditingTitle}
      fontSize={39}
      fontWeight="light"
      sx={{ cursor: 'pointer' }}
    >
      {title}
    </Typography>
  );
};
