import request from '@/utils/request'

export function findAll(brand) {
    return request({
        url: '/phones',
        method: 'get',
        params: { brand }
    })
}