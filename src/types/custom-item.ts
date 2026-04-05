import type { ReactNode } from 'react';

export interface CustomItem {
  path: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
}
