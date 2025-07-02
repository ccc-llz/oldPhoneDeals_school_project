import request from '@/utils/request'

export function getAllOperations(params) {
  return request({
    url: '/admin/operations',
    method: 'get',
    params,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}