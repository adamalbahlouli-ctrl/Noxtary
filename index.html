// ============================================================
// NOXTARY — utils.js
// الدوال المشتركة
// ============================================================

function getTypeConfig(type) {
    return TYPE_CONFIG[type] || { color: '#64b5f6', label: (type || '').toUpperCase(), icon: '◈' };
}

function getTranslation(key, defaultVal) {
    const currentLang = localStorage.getItem('noxtary_lang') || 'EN';
    return TRANSLATIONS[currentLang]?.[key] || defaultVal || key;
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;

    if (lang === 'AR') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.children.length > 0) {
                let textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.nodeValue = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            } else {
                el.textContent = dict[key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.setAttribute('placeholder', dict[key]);
        }
    });
}

function applyTheme(themeName) {
    document.body.classList.remove('theme-cyber-dark', 'theme-neon-purple', 'theme-emerald-green', 'theme-sunset-orange', 'theme-neo-light');
    document.body.classList.add('theme-' + themeName);
    localStorage.setItem('noxtary_theme', themeName);

    document.querySelectorAll('.theme-option').forEach(opt => {
        if (opt.getAttribute('data-theme') === themeName) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    const label = document.getElementById('currentTheme');
    if (label) {
        const themeOptionText = document.querySelector(`.theme-option[data-theme="${themeName}"]`)?.textContent || themeName;
        label.textContent = themeOptionText.trim();
    }

    if (window.spaceColors && THEME_CANVAS_COLORS[themeName]) {
        const themeColors = THEME_CANVAS_COLORS[themeName];
        Object.keys(themeColors).forEach(c => {
            window.spaceColors[c] = themeColors[c];
        });
    }
}

function viewProduct(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + productId;
}

function shareProduct(title) {
    if (navigator.share) {
        navigator.share({ title: title + ' — NOXTARY', url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const toast = document.getElementById('pdCopyToast');
            if (!toast) return;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = window.location.href;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        });
    }
}
