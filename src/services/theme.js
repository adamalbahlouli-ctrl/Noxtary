/* =====================================================
   THEME SERVICE - theme.js
   ===================================================== */

export const THEME_CANVAS_COLORS = {
    'cyber-dark': {
        cyan:   '#00eaff',
        green:  '#00ff88',
        purple: '#bf5fff',
        blue:   '#4488ff',
        orange: '#ff8800'
    },
    'neon-purple': {
        cyan:   '#a855f7',
        green:  '#ec4899',
        purple: '#bf5fff',
        blue:   '#6366f1',
        orange: '#f43f5e'
    },
    'emerald-green': {
        cyan:   '#10b981',
        green:  '#34d399',
        purple: '#059669',
        blue:   '#047857',
        orange: '#6ee7b7'
    },
    'sunset-orange': {
        cyan:   '#f97316',
        green:  '#fbbf24',
        purple: '#b45309',
        blue:   '#d97706',
        orange: '#f59e0b'
    },
    'neo-light': {
        cyan:   '#3b82f6',
        green:  '#10b981',
        purple: '#8b5cf6',
        blue:   '#2563eb',
        orange: '#f59e0b'
    }
};

export function applyTheme(themeName) {
    // Remove all theme classes first
    document.body.classList.remove('theme-cyber-dark', 'theme-neon-purple', 'theme-emerald-green', 'theme-sunset-orange', 'theme-neo-light');
    document.body.classList.add('theme-' + themeName);
    
    // Save to local storage
    localStorage.setItem('noxtary_theme', themeName);

    // Update active dropdown item
    document.querySelectorAll('.theme-option').forEach(opt => {
        if (opt.getAttribute('data-theme') === themeName) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Update current theme label
    const label = document.getElementById('currentTheme');
    if (label) {
        const themeOptionText = document.querySelector(`.theme-option[data-theme="${themeName}"]`)?.textContent || themeName;
        label.textContent = themeOptionText.trim();
    }

    // Sync canvas colors
    if (window.spaceColors && THEME_CANVAS_COLORS[themeName]) {
        const themeColors = THEME_CANVAS_COLORS[themeName];
        Object.keys(themeColors).forEach(c => {
            window.spaceColors[c] = themeColors[c];
        });
    }
}
