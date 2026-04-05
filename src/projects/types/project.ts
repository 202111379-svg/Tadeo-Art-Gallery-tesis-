import type { Milestone } from './milestone';

export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  acceptanceCriteria: string[];
  milestones: Milestone[];
  imagesUrls: string[];
}
