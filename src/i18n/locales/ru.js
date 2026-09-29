export default {
  brand: 'tg-stats',
  app: {
    subtitle: 'анализ экспорта Telegram',
    addExport: 'Добавить экспорт',
    reset: 'Сбросить',
  },

  upload: {
    dropTitle: 'Перетащите result.json сюда',
    dropHint: 'Можно несколько файлов сразу — если люди переехали из одного чата в другой',
    chooseFiles: 'Выбрать файлы',
    demoData: 'Демо-данные',
    howTo: 'Как выгрузить',
    step1: 'Telegram Desktop → меню чата → «Экспорт истории чата»',
    step2: 'Формат: JSON (не HTML), медиа можно не включать',
    step3: 'Загрузите полученный result.json',
    note: 'Файлы читаются в браузере и никуда не отправляются. Полный экспорт аккаунта (несколько чатов) тоже поддерживается.',
  },

  errors: {
    notExport: '«{name}»: не похоже на JSON-экспорт Telegram',
    empty: 'В файлах нет сообщений',
  },

  members: {
    label: 'Участник',
    wholeChat: 'Весь чат',
    deletedAccount: 'Удалённый аккаунт',
    observed: 'Наблюдение с {date} \u00b7 {count} сообщ. из {files} {filesWord}, {chats} {chatsWord}',
  },

  units: {
    files: ['файл', 'файла', 'файлов'],
    chats: ['чат', 'чата', 'чатов'],
    years: ['год', 'года', 'лет'],
    monthsShort: ['мес.', 'мес.', 'мес.'],
    daysShort: ['день', 'дня', 'дней'],
    members: ['участник', 'участника', 'участников'],
  },

  sections: {
    volume: 'Объём',
    time: 'Время',
    members: 'Участники',
    titleAndAchievements: 'Титул и достижения',
    chatCharacter: 'Характер и достижения чата',
    infographic: 'Инфографика',
  },

  volume: {
    messages: 'Сообщений',
    messagesHint: 'за весь период наблюдения',
    pages: 'Страниц текста',
    pagesValue: '\u2248 {count}',
    pagesHint: '{chars} знаков, 1 стр. = {pageSize}',
    photos: 'Фото',
    videos: 'Видео',
    videosHint: 'файлы, кружки, GIF',
    audio: 'Аудио',
    audioHint: 'голосовые и музыка \u00b7 стикеров: {count}',
  },

  time: {
    activityRange: 'Срок активности',
    chatAge: 'Возраст чата',
    activeDays: 'Активных дней',
    activeDaysHint: 'из {observed} дней наблюдения ({percent}%)',
    streak: 'Серия подряд',
    streakUnit: '{count} {word}',
    streakHint: 'с {date}; последняя серия \u2014 {current}',
    dayRecord: 'Рекорд дня',
    favoriteDay: 'Любимый день',
    favoriteDayHintPersonal: 'больше всего пишет по {day}',
    favoriteDayHintChat: 'чаще всего пишут по {day}',
    peakTime: 'Пик времени',
    peakTimeHint: 'основная доля: {start}\u2013{end}, {percent}% сообщений',
  },

  yearChart: {
    heading: 'Сообщений по годам',
    summary: 'Пиковый год \u2014 {year} ({count}), пиковый месяц \u2014 {month} ({monthCount})',
  },

  heatmap: {
    heading: 'Часы \u00d7 дни недели',
  },

  range: {
    from: 'С',
    to: 'По',
    all: 'Весь период',
    last30: 'Последние 30 дней',
    lastYear: 'Последний год',
    empty: 'В выбранном периоде нет сообщений',
    emptyHint: 'Расширьте диапазон или выберите другой пресет.',
  },

  titleCard: {
    personalLabel: 'Ваш статус',
    chatLabel: 'Характер чата \u00b7 {chatName}',
  },

  partOfDay: {
    morning: 'Утренний',
    afternoon: 'Дневной',
    evening: 'Вечерний',
    night: 'Ночной',
    chatSuffix: 'чат',
  },

  habit: {
    voice: 'голосовик',
    visual: 'визуал',
    novelist: 'романист',
    machineGun: 'пулемётчик',
    chatter: 'собеседник',
  },

  personalWhy: 'Пик в {peak}, в среднем {avg} зн. на сообщение, медиа \u2014 {media}% сообщений',

  chatTag: {
    soloAuthor: 'один автор',
    monologue: 'почти монолог',
    evenDialogue: 'диалог на равных',
    groupChat: 'общий разговор',
  },
  chatWhy: '{count} {memberWord} \u00b7 {tag} \u00b7 лидер \u2014 {leader} ({share}%) \u00b7 пик в {peak}',

  roles: {
    mostActive: 'Больше всех пишет',
    nightOwl: 'Ночная сова',
    mostVerbose: 'Самый многословный',
    mediaLover: 'Любитель медиа',
    voiceLover: 'Голосовой',
    longestStreak: 'Рекордная серия',
  },

  achievements: {
    progress: 'Открыто {done} из {total}',
    unlocked: 'открыто',
    yearStreak: { name: 'Год в строю', description: 'Год с первого сообщения' },
    threeYearStreak: { name: 'Трёхлетка', description: '3 года активности' },
    fiveYearStreak: { name: 'Пятилетка', description: '5 лет активности' },
    veteran: { name: 'Ветеран', description: '10 лет активности' },
    dayCentury: { name: 'Сотня за день', description: '100 сообщений за сутки' },
    dayRush: { name: 'Разгон', description: '300 сообщений за сутки' },
    dayThousand: { name: 'Тысяча за сутки', description: '1 000 сообщений за день' },
    weekStreak: { name: 'Неделя без пропусков', description: '7 дней подряд' },
    monthStreak: { name: 'Месяц без пропусков', description: '30 дней подряд' },
    hundredStreak: { name: 'Сотка подряд', description: '100 дней подряд' },
    yearRoundStreak: { name: 'Год без выходных', description: '365 дней подряд' },
    firstThousand: { name: 'Первая тысяча', description: '1 000 сообщений' },
    tenThousand: { name: 'Десять тысяч', description: '10 000 сообщений' },
    hundredThousand: { name: 'Сто тысяч', description: '100 000 сообщений' },
    consistency: { name: 'Постоянство', description: '100 активных дней' },
    halfYearActive: { name: 'Пол-года в сети', description: '365 активных дней' },
    thousandDaysActive: { name: 'Тысяча дней', description: '1 000 активных дней' },
  },

  membersTable: {
    rank: '#',
    member: 'Участник',
    share: 'Доля сообщений',
    messages: 'Сообщений',
    pages: 'Страниц',
    avgLength: 'Ср. длина',
    peak: 'Пик',
    streak: 'Серия',
    hint: 'Клик по строке открывает статистику этого участника',
    streakDays: '{count} дн.',
  },

  chatFiles: {
    label: 'Чат {index} из {total}',
    untitled: 'Без названия',
    range: '{from} \u2014 {to}',
    messages: '{count} сообщ.',
  },

  infographic: {
    heading: 'Для сторис и репостов \u00b7 1080\u00d71920',
    hint: 'Картинка собирается для выбранного участника \u2014 или для всего чата, если выбран «Весь чат».',
    download: 'Скачать PNG',
    kickerChat: 'TELEGRAM \u00b7 ИТОГИ ЧАТА',
    kickerPersonal: 'TELEGRAM \u00b7 ИТОГИ',
    messagesSuffix: 'сообщений \u00b7 \u2248 {pages} стр. текста',
    activeDays: 'АКТИВНЫХ ДНЕЙ',
    bestStreak: 'ЛУЧШАЯ СЕРИЯ',
    dayRecord: 'РЕКОРД ДНЯ',
    favoriteDay: 'ЛЮБИМЫЙ ДЕНЬ',
    peakActivity: 'ПИК АКТИВНОСТИ',
    media: 'МЕДИА',
    byYear: 'ПО ГОДАМ',
    members: 'УЧАСТНИКИ',
    hoursByDay: 'ЧАСЫ \u00d7 ДНИ',
    achievements: 'Ачивки: {done} из {total}',
    streakDaysShort: '{count} дн.',
  },

  dow: {
    short: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    genitive: ['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам', 'воскресеньям'],
  },
  months: [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
  ],

  localeName: { ru: 'RU', en: 'EN' },
}
