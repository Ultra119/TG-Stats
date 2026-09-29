import { createI18n } from 'vue-i18n'
import ru from './locales/ru.js'
import en from './locales/en.js'

const STORAGE_KEY = 'tg-stats-locale'
const SUPPORTED = ['ru', 'en']

function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED.includes(saved)) return saved

  const browserLang = navigator.language?.slice(0, 2)
  return SUPPORTED.includes(browserLang) ? browserLang : 'ru'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { ru, en },
})

// Persist the chosen language across visits.
i18n.global.locale.value && localStorage.setItem(STORAGE_KEY, i18n.global.locale.value)

export function setLocale(code) {
  i18n.global.locale.value = code
  localStorage.setItem(STORAGE_KEY, code)
}

export default i18n
