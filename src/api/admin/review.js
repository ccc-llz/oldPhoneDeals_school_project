import request from '@/utils/request'

export function getAllReviews(params) {
  const timestamp = new Date().getTime();
  return request({
    url: '/admin/reviews',
    method: 'get',
    params: { ...params, _t: timestamp },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export function toggleReviewVisibility(reviewId) {
  const timestamp = new Date().getTime();
  return request({
    url: `/admin/reviews/${reviewId}/toggle?_t=${timestamp}`,
    method: 'patch',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
}