import { MemorableMoment } from '@src/types/moment';
import { StoriesPost } from '@src/types/api';
import { CAPTION_FILTER_PREFIXES, SOCIAL_MEDIA_BASE_URL } from '@constants/index';

export const getVirtualizedLoop = (sourceCount: number) => {
  if (sourceCount === 0) return { totalCount: 0, initialIndex: 0 };
  
  const totalCount = Math.max(sourceCount * 9, 120);
  const middleLoop = Math.floor(totalCount / sourceCount / 2);
  
  return {
    totalCount,
    initialIndex: middleLoop * sourceCount,
  };
}


export const mapPostToMoment = (post: StoriesPost): MemorableMoment => {
  const media = post.medias[0];
  const location = post.fbPosts?.[0]?.name ?? '';

  const caption = post.content
    .split('\n')
    .filter((line: string) => !CAPTION_FILTER_PREFIXES.some((prefix) => line.startsWith(prefix)))
    .join('\n')
    .trim();

  return {
    id: post._id,
    location,
    caption,
    thumbnailUrl: `${SOCIAL_MEDIA_BASE_URL}${media.thumbnail}`,
    videoSource: media.isTranscoded ? `${SOCIAL_MEDIA_BASE_URL}${media.url.trim()}` : null,
  };
}
