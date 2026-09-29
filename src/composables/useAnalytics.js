import { computed } from 'vue'
import { PAGE_CHARS, calcStats, buildBoard, buildAchievements, buildYearSeries } from '../analytics.js'
import { useFormatters } from './useFormatters.js'

/**
 * `store` — reactive() over createStore(), `sel` — ref with a member id or
 * '*' for the whole chat. This is where localized, ready-to-render strings
 * are assembled from the language-agnostic numbers produced by analytics.js —
 * components below it just render, they don't compose sentences.
 */
export function useAnalytics(store, sel) {
  const { t, rawMessage, fmt, dstr, hh, pluralize, formatSpan } = useFormatters()

  const has = computed(() => store.all.n > 0)
  const isAll = computed(() => sel.value === '*')
  const bucket = computed(() => (isAll.value ? store.all : store.users[sel.value] || store.all))
  const displayName = (name) => name || t('members.deletedAccount')

  const items = computed(() => [
    { title: `${t('members.wholeChat')} \u00b7 ${fmt(store.all.n)}`, value: '*' },
    ...Object.entries(store.users)
      .sort((a, b) => b[1].n - a[1].n)
      .map(([id, u]) => ({ title: `${displayName(u.name)} \u00b7 ${fmt(u.n)}`, value: id })),
  ])

  const board = computed(() => buildBoard(store, PAGE_CHARS))

  const stats = computed(() => {
    if (!has.value) return null
    const raw = calcStats(bucket.value)

    if (!isAll.value) {
      return {
        ...raw,
        title: `${t(`partOfDay.${raw.pd}`)} ${t(`habit.${raw.nn}`)}`,
        why: t('personalWhy', {
          peak: hh(raw.ph),
          avg: fmt(raw.avgLength),
          media: Math.round(raw.mediaShare * 100),
        }),
      }
    }

    const rows = board.value
    const top = rows[0]
    const memberCount = Object.keys(store.users).length
    const tagKey =
      memberCount < 2 ? 'soloAuthor' :
      top.share > 0.7 ? 'monologue' :
      memberCount === 2 && top.share < 0.6 ? 'evenDialogue' : 'groupChat'

    return {
      ...raw,
      title: `${t(`partOfDay.${raw.pd}`)} ${t('partOfDay.chatSuffix')}`,
      why: t('chatWhy', {
        count: memberCount,
        memberWord: pluralize(memberCount, rawMessage('units.members')),
        tag: t(`chatTag.${tagKey}`),
        leader: displayName(top.name),
        share: Math.round(top.share * 100),
        peak: hh(raw.ph),
      }),
    }
  })

  const vol = computed(() => {
    const a = bucket.value
    return [
      [t('volume.messages'), fmt(a.n), t('volume.messagesHint')],
      [
        t('volume.pages'),
        t('volume.pagesValue', { count: fmt(a.ch / PAGE_CHARS) }),
        t('volume.pagesHint', { chars: fmt(a.ch), pageSize: fmt(PAGE_CHARS) }),
      ],
      [t('volume.photos'), fmt(a.ph), ''],
      [t('volume.videos'), fmt(a.vd), t('volume.videosHint')],
      [t('volume.audio'), fmt(a.au), t('volume.audioHint', { count: fmt(a.st) })],
    ]
  })

  const tm = computed(() => {
    const s = stats.value
    const a = bucket.value
    const observed = store.all.last - store.all.first + 1
    const dowShort = rawMessage('dow.short')
    const dowGenitive = rawMessage('dow.genitive')

    return [
      [
        isAll.value ? t('time.chatAge') : t('time.activityRange'),
        formatSpan(s.days),
        `${dstr(a.first)} \u2014 ${dstr(a.last)}`,
      ],
      [
        t('time.activeDays'),
        fmt(s.active),
        t('time.activeDaysHint', { observed: fmt(observed), percent: Math.round((s.active / observed) * 100) }),
      ],
      [
        t('time.streak'),
        t('time.streakUnit', { count: s.best, word: pluralize(s.best, rawMessage('units.daysShort')) }),
        s.best ? t('time.streakHint', { date: dstr(s.bs), current: s.run }) : '',
      ],
      [t('time.dayRecord'), fmt(s.rec), dstr(s.recD)],
      [
        t('time.favoriteDay'),
        dowShort[s.fd],
        isAll.value
          ? t('time.favoriteDayHintChat', { day: dowGenitive[s.fd] })
          : t('time.favoriteDayHintPersonal', { day: dowGenitive[s.fd] }),
      ],
      [
        t('time.peakTime'),
        hh(s.ph),
        t('time.peakTimeHint', { start: hh(s.ws), end: hh(s.ws + 4), percent: Math.round(s.share * 100) }),
      ],
    ]
  })

  const yearSeries = computed(() => buildYearSeries(stats.value?.yr || {}))
  const chatList = computed(() => [...store.list].sort((a, b) => a.first - b.first))
  const chatName = computed(() =>
    chatList.value.map((c) => c.name || t('chatFiles.untitled')).join(' \u2192 '),
  )

  const ach = computed(() => buildAchievements(stats.value, bucket.value.n))
  const done = computed(() => ach.value.filter((a) => a.c >= a.t).length)

  return { has, isAll, bucket, items, board, stats, vol, tm, yearSeries, chatList, chatName, ach, done, displayName }
}
