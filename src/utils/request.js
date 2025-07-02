import axios from 'axios'
import { useCounterStore } from '@/stores'
import Router from '@/router'
import { removeToken,getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: '/api', // url = base url + request url
  withCredentials: true,
  timeout: 500000 
})


//axios interceptors
service.interceptors.request.use(
  config => {
    let token = getToken();
    if(token){
      config.headers['token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error)
  }
)

// service.interceptors.response.use(res=>{
//     if (res.data.code === 0 && res.data.msg === 'NOT_LOGIN') {// return to Login
//         console.log('Not Logged, return to Login');
//         removeToken();
//         Router.replace('/login');
//         return res;
//       } else {
//         return res;
//       }
//     },
    
//     error => {
//       console.log('err' + error)
//       return Promise.reject(error)

// })

service.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response && error.response.status === 401) {
      ElMessage.error('The session has expired, please log in again');
      error.__handled = true;
      removeToken();
      localStorage.setItem('redirectAfterLogin', Router.currentRoute.value.fullPath);
      Router.push('/admin/login');
    }
    
    return Promise.reject(error);
  }
);

export default service
