import axios from 'axios'

const api = axios.create({
  // baseURL: 'http://127.0.0.1:8000/api',
  baseURL: 'https://api-management.octomedia.digital/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 2. Response Interceptor: اصطياد خطأ 401 والطرد التلقائي (مع استثناء طلبات تسجيل الدخول)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login')

    if (error.response && error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user')

      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/'
      }
    }

    // اصطياد وضع تجميد المنظومة (423 Locked) وعرض تنبيه واضح ومفهوم
    if (error.response && (error.response.status === 423 || error.response.data?.code === 'SYSTEM_FROZEN')) {
      const msg = error.response.data?.message || 'المنظومة في وضع الصيانة والتجميد المؤقت (للقراءة فقط).';
      import('./services/alertService').then(m => {
        m.default.warning(msg);
      }).catch(() => {});
    }

    return Promise.reject(error)
  },
)

export default api
