export type GetStoriesVariables = {
  pagination: {
    page: number;
    limit: number;
  };
};

export type StoriesMedia = {
  thumbnail: string;
  url: string;
  mimetype: string;
  isTranscoded: boolean;
  id: string;
  __typename: string;
};

export type StoriesPost = {
  _id: string;
  content: string;
  fbPosts: Array<{ name: string; __typename: string }>;
  medias: StoriesMedia[];
  __typename: string;
};

export type GetStoriesResponse = {
  data: {
    getStoriesPostPagination: {
      data: StoriesPost[];
      pagination: {
        totalDocs: number;
        __typename: string;
      };
      __typename: string;
    };
  };
};

import { MemorableMoment } from '@src/types/moment';

export type FetchMomentsResult = {
  moments: MemorableMoment[];
  totalDocs: number;
};
