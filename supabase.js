// ============================================================
// NOXTARY — js/products.js
// TYPE CONFIG | Card Builders | Render Engine
// ============================================================

// ─────────────────────────────────────────────
// TYPE CONFIG — نظام الهوية البصرية
// ملاحظة: 'books' و 'articles' كلاهما يُعرضان في تبويب "books_articles"
// ─────────────────────────────────────────────
const TYPE_CONFIG = {
    apps:      { color: '#00d4ff', label: 'APP',     icon: '⬡' },
    books:     { color: '#a855f7', label: 'BOOK',    icon: '▣' },
    mods:      { color: '#f97316', label: 'MOD',     icon: '⚙' },
    articles:  { color: '#22c55e', label: 'ARTICLE', icon: '✦' },
    audio:     { color: '#06b6d4', label: 'AUDIO',   icon: '♪' },
    services:  { color: '#eab308', label: 'SERVICE', icon: '★' },
};

// مجموعات التبويبات — أي data-filter يطابق أي أنواع type
const TAB_GROUPS = {
    all:            null, // كل شيء
    apps:           ['apps'],
    books_articles: ['books', 'articles'],
    mods:           ['mods'],
    audio:          ['audio'],
    services:       ['services'],
};

function getTypeConfig(type) {
    return TYPE_CONFIG[type] || { color: '#64b5f6', label: (type || '').toUpperCase(), icon: '◈' };
}


// ─────────────────────────────────────────────
// CARD BUILDERS
// ─────────────────────────────────────────────

// ── الكارت الموحد لقسم All ──────────────────
function buildUnifiedCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = 'nc-unified';
    div.style.setProperty('--type-color', cfg.color);
    div.innerHTML = `
        <div class="nc-unified__top">
            <img src="${item.image}" alt="${item.title}" class="nc-unified__img"
                 onerror="this.src='https://via.placeholder.com/56/111827/ffffff?text=N'">
            <div class="nc-unified__body">
                <span class="nc-badge" style="--type-color:${cfg.color}">
                    ${cfg.icon} ${cfg.label}
                </span>
                <h3 class="nc-unified__title">${item.title}</h3>
                <p class="nc-unified__desc">${item.description || ''}</p>
            </div>
        </div>
        <button class="nc-unified__btn nc-btn"
                style="--type-color:${cfg.color}"
                onclick="viewProduct('${item.app_id}')">
            View
        </button>
    `;
    return div;
}

// ── App Card ──
function buildAppCard(item) {
    const div = document.createElement('div');
    div.className = 'nc-card nc-app';
    div.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="nc-app__icon"
             onerror="this.src='https://via.placeholder.com/80/0a1628/00d4ff?text=APP'">
        <div class="nc-app__meta-row">
            <span class="nc-badge" style="--type-color:#00d4ff">⬡ APP</span>
            ${item.version ? `<span class="nc-meta-chip">v${item.version}</span>` : ''}
            ${item.size    ? `<span class="nc-meta-chip">${item.size}</span>` : ''}
        </div>
        <h3 class="nc-card__title">${item.title}</h3>
        <p class="nc-card__desc">${item.description || ''}</p>
        <div class="nc-card__actions">
            <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#00d4ff"
                    onclick="viewProduct('${item.app_id}')">
                👁 View
            </button>
        </div>
    `;
    return div;
}

// ── Book / Article Card ──
function buildBookArticleCard(item) {
    const isBook = item.type === 'books';
    const cfg    = getTypeConfig(item.type);
    const div    = document.createElement('div');
    div.className = 'nc-card nc-ba';
    div.style.setProperty('--type-color', cfg.color);

    const metaHTML = isBook
        ? `${item.author ? `<span class="nc-meta-chip">✍️ ${item.author}</span>` : ''}
           ${item.pages  ? `<span class="nc-meta-chip">📄 ${item.pages}p</span>` : ''}`
        : `${item.author       ? `<span class="nc-meta-chip">✎ ${item.author}</span>` : ''}
           ${item.read_time    ? `<span class="nc-meta-chip">⏱ ${item.read_time}</span>` : ''}
           ${item.publish_date ? `<span class="nc-meta-chip">📅 ${item.publish_date}</span>` : ''}`;

    div.innerHTML = `
        <div class="nc-ba__img-wrap nc-ba__img-wrap--${isBook ? 'book' : 'article'}">
            <img src="${item.image}" alt="${item.title}" class="nc-ba__img"
                 onerror="this.src='https://via.placeholder.com/300x300/0a0a1a/${cfg.color.replace('#','')}?text=N'">
            <span class="nc-badge nc-ba__badge" style="--type-color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
        </div>
        <div class="nc-ba__body">
            <h3 class="nc-card__title">${item.title}</h3>
            <div class="nc-ba__meta-row">${metaHTML}</div>
            <p class="nc-card__desc">${item.description || ''}</p>
            <div class="nc-card__actions">
                <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:${cfg.color}"
                        onclick="viewProduct('${item.app_id}')">
                    👁 View
                </button>
            </div>
        </div>
    `;
    return div;
}

// ── Mod Card ──
function buildModCard(item) {
    const div = document.createElement('div');
    div.className = 'nc-card nc-mod';
    div.innerHTML = `
        <div class="nc-mod__left">
            <img src="${item.image}" alt="${item.title}" class="nc-mod__icon"
                 onerror="this.src='https://via.placeholder.com/72/1a0a00/f97316?text=MOD'">
        </div>
        <div class="nc-mod__body">
            <div class="nc-mod__meta-row">
                <span class="nc-badge" style="--type-color:#f97316">⚙ MOD</span>
                ${item.game    ? `<span class="nc-meta-chip">🎮 ${item.game}</span>` : ''}
                ${item.version ? `<span class="nc-meta-chip">v${item.version}</span>` : ''}
            </div>
            <h3 class="nc-card__title">${item.title}</h3>
            <p class="nc-card__desc">${item.description || ''}</p>
        </div>
        <div class="nc-mod__actions">
            <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#f97316"
                    onclick="viewProduct('${item.app_id}')">
                👁 View
            </button>
        </div>
    `;
    return div;
}

// ── Audio Card ──
function buildAudioCard(item) {
    const div = document.createElement('div');
    div.className = 'nc-card nc-audio';
    div.innerHTML = `
        <div class="nc-audio__cover-wrap">
            <img src="${item.image}" alt="${item.title}" class="nc-audio__cover"
                 onerror="this.src='https://via.placeholder.com/160/00101a/06b6d4?text=♪'">
            <div class="nc-audio__play-overlay">▶</div>
        </div>
        <div class="nc-audio__body">
            <div class="nc-audio__meta-row">
                <span class="nc-badge" style="--type-color:#06b6d4">♪ AUDIO</span>
                ${item.duration   ? `<span class="nc-meta-chip">⏱ ${item.duration}</span>` : ''}
                ${item.audio_type ? `<span class="nc-meta-chip">${item.audio_type}</span>` : ''}
            </div>
            <h3 class="nc-card__title">${item.title}</h3>
            <p class="nc-card__desc">${item.description || ''}</p>
            <div class="nc-card__actions">
                <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#06b6d4"
                        onclick="viewProduct('${item.app_id}')">
                    👁 View
                </button>
            </div>
        </div>
    `;
    return div;
}

// ── Service Card ──
function buildServiceCard(item) {
    const div = document.createElement('div');
    div.className = 'nc-card nc-service';
    div.innerHTML = `
        <div class="nc-service__left">
            <img src="${item.image}" alt="${item.title}" class="nc-service__icon"
                 onerror="this.src='https://via.placeholder.com/72/1a1500/eab308?text=★'">
        </div>
        <div class="nc-service__body">
            <div class="nc-service__meta-row">
                <span class="nc-badge" style="--type-color:#eab308">★ SERVICE</span>
                ${item.price ? `<span class="nc-meta-chip">💰 ${item.price}</span>` : ''}
            </div>
            <h3 class="nc-card__title">${item.title}</h3>
            <p class="nc-card__desc">${item.description || ''}</p>
        </div>
        <div class="nc-service__actions">
            <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#eab308"
                    onclick="viewProduct('${item.app_id}')">
                👁 View
            </button>
        </div>
    `;
    return div;
}

// ── Fallback Card ──
function buildFallbackCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = 'nc-card nc-fallback';
    div.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="nc-app__icon"
             onerror="this.src='https://via.placeholder.com/80/0a1628/64b5f6?text=?'">
        <span class="nc-badge" style="--type-color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
        <h3 class="nc-card__title">${item.title}</h3>
        <p class="nc-card__desc">${item.description || ''}</p>
        <div class="nc-card__actions">
            <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:${cfg.color}"
                    onclick="viewProduct('${item.app_id}')">
                👁 View
            </button>
        </div>
    `;
    return div;
}


// ─────────────────────────────────────────────
// RENDER ENGINE
// ─────────────────────────────────────────────
function renderItems(filter = 'all', query = '') {
    const itemsGrid = document.getElementById('itemsGrid');
    if (!itemsGrid) return;

    itemsGrid.innerHTML = '';

    itemsGrid.className = 'items-grid';
    if (filter === 'mods' || filter === 'services') {
        itemsGrid.classList.add('items-grid--list');
    } else if (filter === 'audio') {
        itemsGrid.classList.add('items-grid--covers');
    } else if (filter === 'books_articles') {
        itemsGrid.classList.add('items-grid--ba');
    } else if (filter === 'all') {
        itemsGrid.classList.add('items-grid--unified');
    } else {
        itemsGrid.classList.add('items-grid--apps');
    }

    const allowedTypes = TAB_GROUPS[filter];

    const filtered = productsData.filter(item => {
        const matchesFilter = !allowedTypes || allowedTypes.includes(item.type);
        const matchesSearch = (item.title || '').toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        itemsGrid.innerHTML = `<div class="coming-soon-card">Nothing found. Content coming soon!</div>`;
        return;
    }

    filtered.forEach(item => {
        let card;

        if (filter === 'all') {
            card = buildUnifiedCard(item);
        } else {
            switch (item.type) {
                case 'apps':     card = buildAppCard(item);          break;
                case 'books':
                case 'articles': card = buildBookArticleCard(item);  break;
                case 'mods':     card = buildModCard(item);          break;
                case 'audio':    card = buildAudioCard(item);        break;
                case 'services': card = buildServiceCard(item);      break;
                default:         card = buildFallbackCard(item);
            }
        }

        itemsGrid.appendChild(card);
    });
}


// ─────────────────────────────────────────────
// ROUTING
// ─────────────────────────────────────────────
function viewProduct(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + productId;
}
