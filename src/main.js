import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import alertService from './services/alertService'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.globalProperties.$alert = alertService.alert
app.config.globalProperties.$confirm = alertService.confirm
app.config.globalProperties.$toast = alertService.toast
window.$alertService = alertService
window.$toast = alertService.toast
window.$confirm = alertService.confirm
window.$alert = alertService.alert

// استبدال window.alert الافتراضي بتنبيه المنظومة الفاخر والاحترافي
window.alert = (message) => {
  if (typeof message === 'object' && message !== null) {
    return alertService.alert(message)
  }
  return alertService.alert({ message: String(message ?? ''), title: 'تنبيه', type: 'info' })
}

app.mount('#app')
