import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { endOfYear } from 'date-fns';

// Máximo: fin del año actual — una temporada no cruza años
const MAX_DATE = endOfYear(new Date());

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
      maxDate={MAX_DATE}
      openTo="day"
      views={['month', 'day', 'hours', 'minutes']}
      ampm
      sx={{ width: '100%' }}
      slotProps={{
        textField: {
          fullWidth: true,
          error: !!hasError,
          helperText: hasError ? 'Fecha inválida' : undefined,
        },
        actionBar: {
          actions: ['today', 'accept'],
        },
      }}
    />
  );
};
