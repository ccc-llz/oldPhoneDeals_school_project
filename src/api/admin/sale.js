import request from '@/utils/request'

// Define API base URL
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function getAllTransactions(params) {
  const timestamp = new Date().getTime();
  return request({
    url: '/admin/transactions',
    method: 'get',
    params: { ...params, _t: timestamp },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export function getTransactionDetails(id) {
  return request({
    url: `/admin/transactions/${id}`,
    method: 'get'
  });
}

export function exportTransactions(params) {
  return request({
    url: `/admin/transactions/export`,
    method: 'get',
    params,
    responseType: 'text',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export function addTransaction(data) {
  return request({
    url: '/admin/transactions',
    method: 'post',
    data
  });
}

export function logAction(data) {
  return request({
    url: '/admin/log',
    method: 'post',
    data
  });
}