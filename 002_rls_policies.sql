// ============================================================
// NOXTARY — main.js
// نقطة البداية
// ============================================================

async function initApp() {
    try {
        await fetchProducts();
        initHomePage();
        loadProductDetails();
    } catch (error) {
        console.error('NOXTARY — Data load error:', error);
        const grid = document.getElementById('itemsGrid');
        if (grid) grid.innerHTML = `<div class="coming-soon-card">⚠️ Could not load content. Please try again later.</div>`;
        const container = document.getElementById('product-load-container');
        if (container) container.innerHTML = `<div class="pd-error"><p>⚠️ Could not load data.</p><a href="home.html" class="pd-back-link">← Go Back</a></div>`;
    }
}

function setupDropdowns() {
    const langBtn      = document.getElementById('translateBtn');
    const langDropdown = document.getElementById('langDropdown');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
            langBtn.classList.toggle('open');
            const themeDropdown = document.getElementById('themeDropdown');
            const themeBtn = document.getElementById('themeBtn');
            if (themeDropdown) themeDropdown.classList.remove('show');
            if (themeBtn) themeBtn.classList.remove('open');
        });

        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.getAttribute('data-lang');
                localStorage.setItem('noxtary_lang', lang);

                document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');

                const currentLangEl = document.getElementById('currentLang');
                if (currentLangEl) currentLangEl.textContent = lang;

                applyTranslations(lang);

                const activeFilter = document.querySelector('.tab-btn.active')?.dataset.filter || 'all';
                const searchVal = document.getElementById('searchInput')?.value || '';
                renderItems(activeFilter, searchVal);

                loadProductDetails();

                langDropdown.classList.remove('show');
                langBtn.classList.remove('open');
            });
        });
    }

    const themeBtn      = document.getElementById('themeBtn');
    const themeDropdown = document.getElementById('themeDropdown');

    if (themeBtn && themeDropdown) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('show');
            themeBtn.classList.toggle('open');
            if (langDropdown) langDropdown.classList.remove('show');
            if (langBtn) langBtn.classList.remove('open');
        });

        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const theme = opt.getAttribute('data-theme');
                applyTheme(theme);
                themeDropdown.classList.remove('show');
                themeBtn.classList.remove('open');
            });
        });
    }

    document.addEventListener('click', () => {
        if (langDropdown) langDropdown.classList.remove('show');
        if (langBtn) langBtn.classList.remove('open');
        if (themeDropdown) themeDropdown.classList.remove('show');
        if (themeBtn) themeBtn.classList.remove('open');
    });
}

function initializeCore() {
    const savedTheme = localStorage.getItem('noxtary_theme') || 'cyber-dark';
    applyTheme(savedTheme);

    const savedLang = localStorage.getItem('noxtary_lang') || 'EN';
    const langBtn = document.getElementById('translateBtn');
    if (langBtn) {
        document.querySelectorAll('.lang-option').forEach(o => {
            if (o.getAttribute('data-lang') === savedLang) {
                o.classList.add('active');
            } else {
                o.classList.remove('active');
            }
        });
        const currentLangEl = document.getElementById('currentLang');
        if (currentLangEl) currentLangEl.textContent = savedLang;
    }
    applyTranslations(savedLang);

    setupDropdowns();
    setupLoginModal();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCore();
    initApp();
});
