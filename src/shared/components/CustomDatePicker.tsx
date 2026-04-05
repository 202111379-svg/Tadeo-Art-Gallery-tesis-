import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface CustomDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (value: any) => void;
  hasError?: boolean;
  minDate?: Date;
  minDateTime?: Date;
}

export const CustomDatePicker = ({
  label,
  onChange,
  minDate,
  minDateTime,
  value,
  hasError,
}: CustomDatePickerProps) => {
  return (
    <DateTimePicker
      label={label}
      value={value}
      onChange={onChange}
      minDate={minDate}
      minDateTime={minDateTime}
      ampm
      sx={{ width: '100%' }}
      slotProps={{
        textField: {
          fullWidth: true,
          error: !!hasError,
          helperText: hasError ? 'Fecha inválida' : undefined,
        },
        actionBar: {
          actions: ['clear', 'today', 'accept'],
        },
      }}
    />
  );
};
