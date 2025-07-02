import request from '@/utils/request'

export function getAllUsers(params) {
  const timestamp = new Date().getTime();
  return request({
    url: '/admin/users',
    method: 'get',
    params: { ...params, _t: timestamp },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export function updateUser(id, data) {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  });
}

export function toggleListingStatus(id) {
  return request({
    url: `/admin/users/${id}/toggle`,
    method: 'patch'
  });
}

export function deleteUser(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  });
}

export function getListingsByUserId(id) {
  return request({
    url: `/admin/users/${id}/listings`,
    method: 'get'
  });
}

export function getReviewsByUserId(id) {
  return request({
    url: `/admin/users/${id}/reviews`,
    method: 'get'
  });
}

export function getUserDetails(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  });
}