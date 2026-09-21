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

app.mount('#app')
