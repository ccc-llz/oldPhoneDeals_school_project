import request from '@/utils/request'

export function getAllListings() {
    return request({
    url: '/admin/listings',
    method: 'get'
  })
};

export function getPagedListings(params) {
  return request({
    url: '/admin/listings/paged',
    method: 'get',
    params
  });
}

export function searchListings(title, brand) {
  return request({
    url: '/admin/listings/search',
    method: 'get',
    params: { title, brand }
  });
}

export function createListing(data) {
  return request({
    url: '/admin/listings',
    method: 'post',
    data
  });
}

export function getListingDetails(id) {
  return request({
    url: `/admin/listings/${id}`,
    method: 'get'
  });
}

export function updateListing(id, data) {
  return request({
    url: `/admin/listings/${id}`,
    method: 'put',
    data
  });
}

export function toggleListingStatus(id) {
  return request({
    url: `/admin/listings/${id}/toggle`,
    method: 'patch'
  });
}

export function deleteListing(id) {
  return request({
    url: `/admin/listings/${id}`,
    method: 'delete'
  });
}