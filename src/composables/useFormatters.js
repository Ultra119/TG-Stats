import { useI18n } from 'vue-i18n'
import { fmt as fmtRaw, dstr as dstrRaw, pluralize, spanParts, hh } from '../analytics.js'

/**
 * Thin bridge between the pure `analytics.js` helpers and vue-i18n: binds
 * them to the current locale, and adds `formatSpan`, which composes a
 * localized "N years M months" string out of numbers + message-file word forms.
 */
export function useFormatters() {
  const { t, tm, locale } = useI18n()

  const fmt = (n) => fmtRaw(n, locale.value)
  const dstr = (days) => dstrRaw(days, locale.value)

  function formatSpan(days) {
    const { years, months } = spanParts(days)
    if (years) {
      const yearsWord = pluralize(years, tm('units.years'))
      const suffix = months ? ` ${months} ${pluralize(months, tm('units.monthsShort'))}` : ''
      return `${years} ${yearsWord}${suffix}`
    }
    if (months) return `${months} ${pluralize(months, tm('units.monthsShort'))}`
    return `${days} ${pluralize(days, tm('units.daysShort'))}`
  }

  return { t, rawMessage: tm, locale, fmt, dstr, hh, pluralize, formatSpan }
}
