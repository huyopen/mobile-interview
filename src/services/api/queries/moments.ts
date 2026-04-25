export const GET_STORIES_POST_PAGINATION = `
  query getStoriesPostPagination($pagination: BasePagePaginationInput) {
    getStoriesPostPagination(pagination: $pagination) {
      data {
        _id
        content
        fbPosts {
          name
          __typename
        }
        medias {
          thumbnail
          url
          mimetype
          isTranscoded
          id
          __typename
        }
        __typename
      }
      pagination {
        totalDocs
        __typename
      }
      __typename
    }
  }
`;
