import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteProjectByIdAction } from '../actions/delete-project-by-id.action';
import { showSnackbar } from '../../store/ui';
import { useAppSelector, useAppDispatch } from '../../store/reduxHooks';

export const useDeleteProject = () => {
  const { uid } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const mutation = useMutation({
    mutationFn: (id: string) => {
      return deleteProjectByIdAction(uid!, id);
    },

    onSuccess: () => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['projects', uid] });
    },
  });

  const handleDelete = async (id: string) => {
    await mutation.mutateAsync(id, {
      onSuccess: () => {
        dispatch(showSnackbar({ isOpen: true, message: 'Proyecto eliminado' }));
      },
      onError: (error) => {
        dispatch(
          showSnackbar({
            isOpen: true,
            message: error.message,
          })
        );
      },
    });
  };

  return {
    //* Props
    isPosting: mutation.isPending,

    //* Methods
    handleDelete,
  };
};
