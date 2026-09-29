import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import { inspectorVuetify } from './theme/theme.js'
import App from './App.vue'
import i18n from './i18n/index.js'
import './styles/style.css'


const vuetify = createVuetify({ components, directives, ...inspectorVuetify })
createApp(App).use(vuetify).use(i18n).mount('#app')
