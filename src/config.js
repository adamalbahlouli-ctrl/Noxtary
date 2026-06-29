/* =====================================================
   CONFIGURATIONS - config.js
   ===================================================== */

export const TYPE_CONFIG = {
    apps:      { color: '#00d4ff', label: 'APP',     icon: '⬡' },
    books:     { color: '#a855f7', label: 'BOOK',    icon: '▣' },
    mods:      { color: '#f97316', label: 'MOD',     icon: '⚙' },
    articles:  { color: '#22c55e', label: 'ARTICLE', icon: '✦' },
    audio:     { color: '#06b6d4', label: 'AUDIO',   icon: '♪' },
    services:  { color: '#eab308', label: 'SERVICE', icon: '★' },
};

export const TAB_GROUPS = {
    all:            null,
    apps:           ['apps'],
    books_articles: ['books', 'articles'],
    mods:           ['mods'],
    audio:          ['audio'],
    services:       ['services'],
};

export function getTypeConfig(type) {
    return TYPE_CONFIG[type] || { color: '#64b5f6', label: (type || '').toUpperCase(), icon: '◈' };
}
