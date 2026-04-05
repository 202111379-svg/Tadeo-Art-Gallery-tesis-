import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

type CircularProgressColor =
  | 'inherit'
  | 'warning'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success';

interface Props {
  backgroundColor?: string;
  circularProgressColor?: CircularProgressColor;
}

export const FullScreenLoading = ({
  backgroundColor,
  circularProgressColor,
}: Props) => {
  return (
    <Grid
      container
      spacing={0}
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: '100vh',
        backgroundColor: backgroundColor,
        padding: 4,
      }}
    >
      <Grid container direction="row" justifyContent="center">
        <CircularProgress color={circularProgressColor} />
      </Grid>
    </Grid>
  );
};
