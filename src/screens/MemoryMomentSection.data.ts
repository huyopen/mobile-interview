import { MemorableMoment } from '@src/types/moment';

export const SKELETON_COUNT = 3;

export const SKELETON_SOURCE: MemorableMoment[] = Array.from({ length: SKELETON_COUNT }, (_, i) => ({
  id: `skeleton-${i}`,
  location: '',
  caption: '',
  thumbnailUrl: '',
}));