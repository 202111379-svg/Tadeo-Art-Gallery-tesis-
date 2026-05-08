import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProjectByIdAction } from '../actions/delete-project-by-id.action';
import { showSnackbar } from '../../store/ui';
import { useAppSelector, useAppDispatch } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/season-context';

export const useDeleteProject = () => {
  const { uid } = useAppSelector((state) => state.auth);
  const { activeSeason } = useSeasonContext();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteProjectByIdAction(uid!, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects', uid, activeSeason?.id] });
      queryClient.removeQueries({ queryKey: ['project', uid, id] });
    },
  });

  const handleDelete = async (id: string) => {
    await mutation.mutateAsync(id, {
      onSuccess: () => dispatch(showSnackbar({ isOpen: true, message: 'Proyecto eliminado' })),
      onError: (error) => dispatch(showSnackbar({ isOpen: true, message: error.message })),
    });
  };

  return { isPosting: mutation.isPending, handleDelete };
};
