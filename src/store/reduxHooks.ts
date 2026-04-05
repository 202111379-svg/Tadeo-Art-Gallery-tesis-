import { useDispatch, useSelector } from 'react-redux';
import type { AppDispach, RootState } from '.';

export const useAppDispatch = useDispatch.withTypes<AppDispach>();
export const useAppSelector = useSelector.withTypes<RootState>();
