import type { Project } from '../types/project';

const localProjectToFirebaseProject = (
  projectLike: Partial<Project> & { files?: File[] }
): Omit<Partial<Project>, 'files'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { files, ...rest } = projectLike;
  return rest;
};

export default {
  localProjectToFirebaseProject,
};
