import { FetchMomentsResult, GetStoriesResponse, GetStoriesVariables } from '@src/types/api';
import { socialClient } from '@services/client';
import { GET_STORIES_POST_PAGINATION } from '@services/api/queries/moments';
import { mapPostToMoment } from '@utils/index';

export async function fetchMoments(page = 1, limit = 30): Promise<FetchMomentsResult> {
  const { data } = await socialClient.post<GetStoriesResponse>('/graphql', {
    operationName: 'getStoriesPostPagination',
    variables: { pagination: { page, limit } } satisfies GetStoriesVariables,
    query: GET_STORIES_POST_PAGINATION,
  });

  const posts = data?.data?.getStoriesPostPagination?.data ?? [];
  const totalDocs = data?.data?.getStoriesPostPagination?.pagination?.totalDocs ?? 0;

  const moments = posts
    .filter((post) => post.medias?.length > 0)
    .map(mapPostToMoment)
    .filter((moment) => 
      moment.videoSource !== null && // Phải có video (đã transcoded)
      moment.thumbnailUrl !== null && // Phải có thumbnail
      moment.thumbnailUrl.trim() !== '' // Thumbnail không empty
    );

  return { moments, totalDocs };
}
