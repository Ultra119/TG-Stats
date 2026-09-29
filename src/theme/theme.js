export const inspectorTheme = {
  dark: true,
  colors: {
    background: '#14161B',
    surface: '#1B1E25',
    'surface-variant': '#242833',
    primary: '#5EEAD4',
    secondary: '#F5A623',
    error: '#E8607B',
    'on-background': '#E7E9EE',
    'on-surface': '#E7E9EE',
  },
}

export const inspectorVuetify = {
  theme: {
    defaultTheme: 'inspector',
    themes: { inspector: inspectorTheme },
  },
  defaults: {
    VBtn: { rounded: '0' },
    VBtnToggle: { rounded: '0', variant: 'outlined', divided: true },
    VCard: { rounded: '0', elevation: 0 },
    VSheet: { rounded: '0' },
    VChip: { rounded: '0' },
    VAlert: { rounded: '0' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable', rounded: '0' },
  },
}
