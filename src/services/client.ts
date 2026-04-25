import axios from 'axios';
import { SOCIAL_API_BASE_URL, SOCIAL_GUEST_ID, SOCIAL_ORIGIN } from '@constants/index';

export const socialClient = axios.create({
  baseURL: SOCIAL_API_BASE_URL,
  headers: {
    'content-type': 'application/json',
    'apollo-require-preflight': 'true',
    'authorization': 'Bearer',
    'origin': SOCIAL_ORIGIN,
    'referer': `${SOCIAL_ORIGIN}/`,
    'x-guest-id': SOCIAL_GUEST_ID,
  },
});
