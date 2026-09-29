export default {
  brand: 'tg-stats',
  app: {
    subtitle: 'Telegram export analytics',
    addExport: 'Add export',
    reset: 'Reset',
  },

  upload: {
    dropTitle: 'Drop your result.json here',
    dropHint: 'You can drop several files at once — handy if people migrated from one chat to another',
    chooseFiles: 'Choose files',
    demoData: 'Demo data',
    howTo: 'How to export',
    step1: 'Telegram Desktop → chat menu → "Export chat history"',
    step2: 'Format: JSON (not HTML) — media can be skipped',
    step3: 'Upload the resulting result.json',
    note: 'Files are parsed in your browser and never sent anywhere. Full account exports (several chats) are supported too.',
  },

  errors: {
    notExport: '"{name}" doesn\u2019t look like a Telegram JSON export',
    empty: 'No messages found in the uploaded files',
  },

  members: {
    label: 'Member',
    wholeChat: 'Whole chat',
    deletedAccount: 'Deleted account',
    observed: 'Observed since {date} \u00b7 {count} messages from {files} {filesWord}, {chats} {chatsWord}',
  },

  units: {
    files: ['file', 'files'],
    chats: ['chat', 'chats'],
    years: ['year', 'years'],
    monthsShort: ['mo.', 'mo.'],
    daysShort: ['day', 'days'],
    members: ['member', 'members'],
  },

  sections: {
    volume: 'Volume',
    time: 'Time',
    members: 'Members',
    titleAndAchievements: 'Title & achievements',
    chatCharacter: 'Chat character & achievements',
    infographic: 'Infographic',
  },

  volume: {
    messages: 'Messages',
    messagesHint: 'over the whole observed period',
    pages: 'Pages of text',
    pagesValue: '\u2248 {count}',
    pagesHint: '{chars} characters, 1 page = {pageSize}',
    photos: 'Photos',
    videos: 'Videos',
    videosHint: 'files, video notes, GIFs',
    audio: 'Audio',
    audioHint: 'voice messages and music \u00b7 stickers: {count}',
  },

  time: {
    activityRange: 'Active period',
    chatAge: 'Chat age',
    activeDays: 'Active days',
    activeDaysHint: 'out of {observed} days observed ({percent}%)',
    streak: 'Longest streak',
    streakUnit: '{count} {word}',
    streakHint: 'since {date}; current streak \u2014 {current}',
    dayRecord: 'Best day',
    favoriteDay: 'Favorite day',
    favoriteDayHintPersonal: 'writes the most on {day}',
    favoriteDayHintChat: 'the group is busiest on {day}',
    peakTime: 'Peak time',
    peakTimeHint: '{start}\u2013{end} accounts for {percent}% of messages',
  },

  yearChart: {
    heading: 'Messages by year',
    summary: 'Peak year \u2014 {year} ({count}), peak month \u2014 {month} ({monthCount})',
  },

  heatmap: {
    heading: 'Hours \u00d7 weekdays',
  },

  titleCard: {
    personalLabel: 'Your status',
    chatLabel: 'Chat character \u00b7 {chatName}',
  },

  partOfDay: {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    chatSuffix: 'chat',
  },

  habit: {
    voice: 'voice-noter',
    visual: 'visual talker',
    novelist: 'novelist',
    machineGun: 'machine-gunner',
    chatter: 'chatter',
  },

  personalWhy: 'Peaks at {peak}, averages {avg} characters per message, media makes up {media}% of messages',

  chatTag: {
    soloAuthor: 'a single author',
    monologue: 'nearly a monologue',
    evenDialogue: 'an even two-way dialogue',
    groupChat: 'a group conversation',
  },
  chatWhy: '{count} {memberWord} \u00b7 {tag} \u00b7 leader \u2014 {leader} ({share}%) \u00b7 peaks at {peak}',

  roles: {
    mostActive: 'Writes the most',
    nightOwl: 'Night owl',
    mostVerbose: 'Most talkative',
    mediaLover: 'Media lover',
    voiceLover: 'Voice messages',
    longestStreak: 'Longest streak',
  },

  achievements: {
    progress: 'Unlocked {done} of {total}',
    unlocked: 'unlocked',
    yearStreak: { name: 'A year in', description: 'A year since the first message' },
    threeYearStreak: { name: 'Three years in', description: '3 years of activity' },
    fiveYearStreak: { name: 'Five years in', description: '5 years of activity' },
    veteran: { name: 'Veteran', description: '10 years of activity' },
    dayCentury: { name: 'Century day', description: '100 messages in a day' },
    dayRush: { name: 'Rush', description: '300 messages in a day' },
    dayThousand: { name: 'Thousand a day', description: '1,000 messages in a day' },
    weekStreak: { name: 'No gaps for a week', description: '7 days in a row' },
    monthStreak: { name: 'No gaps for a month', description: '30 days in a row' },
    hundredStreak: { name: 'Century streak', description: '100 days in a row' },
    yearRoundStreak: { name: 'No days off', description: '365 days in a row' },
    firstThousand: { name: 'First thousand', description: '1,000 messages' },
    tenThousand: { name: 'Ten thousand', description: '10,000 messages' },
    hundredThousand: { name: 'Hundred thousand', description: '100,000 messages' },
    consistency: { name: 'Consistency', description: '100 active days' },
    halfYearActive: { name: 'Half a year online', description: '365 active days' },
    thousandDaysActive: { name: 'A thousand days', description: '1,000 active days' },
  },

  membersTable: {
    rank: '#',
    member: 'Member',
    share: 'Message share',
    messages: 'Messages',
    pages: 'Pages',
    avgLength: 'Avg. length',
    peak: 'Peak',
    streak: 'Streak',
    hint: 'Click a row to open that member\u2019s stats',
    streakDays: '{count} d.',
  },

  chatFiles: {
    label: 'Chat {index} of {total}',
    untitled: 'Untitled chat',
    range: '{from} \u2014 {to}',
    messages: '{count} messages',
  },

  infographic: {
    heading: 'For stories and reposts \u00b7 1080\u00d71920',
    hint: 'The image is generated for the selected member \u2014 or for the whole chat if \u201cWhole chat\u201d is selected.',
    download: 'Download PNG',
    kickerChat: 'TELEGRAM \u00b7 CHAT SUMMARY',
    kickerPersonal: 'TELEGRAM \u00b7 SUMMARY',
    messagesSuffix: 'messages \u00b7 \u2248 {pages} pages of text',
    activeDays: 'ACTIVE DAYS',
    bestStreak: 'BEST STREAK',
    dayRecord: 'DAY RECORD',
    favoriteDay: 'FAVORITE DAY',
    peakActivity: 'PEAK ACTIVITY',
    media: 'MEDIA',
    byYear: 'BY YEAR',
    members: 'MEMBERS',
    hoursByDay: 'HOURS \u00d7 DAYS',
    achievements: 'Achievements: {done} of {total}',
    streakDaysShort: '{count} d.',
  },

  dow: {
    short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    genitive: ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'],
  },
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],

  localeName: { ru: 'RU', en: 'EN' },
}
