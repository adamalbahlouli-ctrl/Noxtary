// ============================================================
// NOXTARY — script.js  (Design System v4)
// Books+Articles merged | Services added | Mobile-fixed buttons
// PDF inline viewer | Unified "View" routing everywhere
// ============================================================

// ─────────────────────────────────────────────
// Supabase Config
// ─────────────────────────────────────────────
const SUPABASE_URL   = 'https://sbwfrigdhivipmmkzgag.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2ZyaWdkaGl2aXBtbWt6Z2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzEzNzIsImV4cCI6MjA5NDg0NzM3Mn0.tKhZOKyOjBZkyh6lJ22A77xd2TPjns3vtNaM1W5pPO8';
const SUPABASE_TABLE = 'apps';

let productsData = [];

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
// 1. INIT — جلب البيانات من Supabase
// ─────────────────────────────────────────────
async function initApp() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*`,
            {
                headers: {
                    'apikey':        SUPABASE_ANON,
                    'Authorization': 'Bearer ' + SUPABASE_ANON,
                    'Content-Type':  'application/json'
                }
            }
        );
        if (!response.ok) throw new Error('Supabase error — status: ' + response.status);
        productsData = await response.json();
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


// ─────────────────────────────────────────────
// 2. CARD BUILDERS
// ─────────────────────────────────────────────

// ── الكارت الموحد لقسم All ──────────────────
// نفس الزر "View" في كل الأنواع بدون استثناء
function getUnifiedHint(type) {
    switch (type) {
        case 'apps': return 'Launch ready';
        case 'books': return 'Knowledge';
        case 'articles': return 'Insight';
        case 'mods': return 'Game ready';
        case 'audio': return 'Audio experience';
        case 'services': return 'On demand';
        default: return 'Curated item';
    }
}

function buildUnifiedCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = `nc-unified nc-unified--${item.type || 'item'}`;
    div.style.setProperty('--type-color', cfg.color);
    div.innerHTML = `
        <div class="nc-unified__top">
            <img src="${item.image}" alt="${item.title}" class="nc-unified__img"
                 onerror="this.src='https://via.placeholder.com/56/111827/ffffff?text=N'">
            <div class="nc-unified__body">
                <div class="nc-unified__meta">
                    <span class="nc-unified__type-chip" style="--type-color:${cfg.color}">
                        ${cfg.icon} ${cfg.label}
                    </span>
                    <span class="nc-unified__hint">${getUnifiedHint(item.type)}</span>
                </div>
                <h3 class="nc-unified__title">${item.title}</h3>
                <p class="nc-unified__desc">${item.description || ''}</p>
            </div>
        </div>
        <button class="nc-unified__btn nc-btn"
                style="--type-color:${cfg.color}"
                onclick="viewProduct('${item.app_id}')">
            ${getTranslation('view', 'View')}
        </button>
    `;
    return div;
}

// ── App Card ─── زر واحد: View (يفتح صفحة التفاصيل) ──
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
                👁 ${getTranslation('view', 'View')}
            </button>
        </div>
    `;
    return div;
}

// ── Book / Article Card — تصميم موحد جديد ──────
// كلاهما type 'books' أو 'articles' يستخدمان نفس الكارت
// الفرق فقط في البادج واللون والـ meta
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
                    👁 ${getTranslation('view', 'View')}
                </button>
            </div>
        </div>
    `;
    return div;
}

// ── Mod Card — زر واحد: View ──
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
                👁 ${getTranslation('view', 'View')}
            </button>
        </div>
    `;
    return div;
}

// ── Audio Card — زر واحد: View ──
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
                    👁 ${getTranslation('view', 'View')}
                </button>
            </div>
        </div>
    `;
    return div;
}

// ── Service Card — بانر أفقي ── زر واحد: View ──
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
                👁 ${getTranslation('view', 'View')}
            </button>
        </div>
    `;
    return div;
}

// ── Fallback Card ───────────────────────────
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
                👁 ${getTranslation('view', 'View')}
            </button>
        </div>
    `;
    return div;
}


// ─────────────────────────────────────────────
// 3. RENDER ENGINE
// ─────────────────────────────────────────────
function renderItems(filter = 'all', query = '') {
    const itemsGrid = document.getElementById('itemsGrid');
    if (!itemsGrid) return;

    itemsGrid.innerHTML = '';

    // ضبط layout الـ grid حسب الفلتر
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

    const allowedTypes = TAB_GROUPS[filter]; // null = الكل

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
// 4. HOME PAGE — Tabs & Search
// ─────────────────────────────────────────────
function initHomePage() {
    const itemsGrid   = document.getElementById('itemsGrid');
    const tabBtns     = document.querySelectorAll('.tab-btn');
    const searchInput = document.getElementById('searchInput');

    if (!itemsGrid) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderItems(btn.dataset.filter, searchInput ? searchInput.value : '');
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const activeFilter = document.querySelector('.tab-btn.active')?.dataset.filter || 'all';
            renderItems(activeFilter, e.target.value);
        });
    }

    renderItems();
}


// ─────────────────────────────────────────────
// 5. ROUTING — كل الكاردات تستخدم هذا فقط
// ─────────────────────────────────────────────
function viewProduct(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + productId;
}


// ─────────────────────────────────────────────
// 6. PRODUCT PAGE — Detail Loader
// ─────────────────────────────────────────────
function loadProductDetails() {
    const container = document.getElementById('product-load-container');
    if (!container) return;

    const params     = new URLSearchParams(window.location.search);
    const selectedId = params.get('id');

    if (!selectedId) {
        container.innerHTML = `<div class="pd-error"><p>No product selected.</p><a href="home.html" class="pd-back-link">← Go Back</a></div>`;
        return;
    }

    const product = productsData.find(p => p.app_id === selectedId);
    if (!product) {
        container.innerHTML = `<div class="pd-error"><p>Product not found.</p><a href="home.html" class="pd-back-link">← Go Back</a></div>`;
        return;
    }

    const cfg = getTypeConfig(product.type);

    const formattedDesc = (product.longDesc || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

    const shots = Array.isArray(product.screenshots)
        ? product.screenshots
        : (typeof product.screenshots === 'string'
            ? JSON.parse(product.screenshots || '[]') : []);

    const screenshotsHTML = shots.length > 0 ? `
        <div class="pd-screenshots-section">
            <h3 class="pd-section-title">Screenshots</h3>
            <div class="pd-screenshots-gallery">
                ${shots.map((src, i) => `
                    <img src="${src}" alt="Screenshot ${i+1}" class="pd-screenshot"
                         loading="lazy" onclick="openLightbox(${i})"
                         onload="if(this.naturalWidth>this.naturalHeight)this.classList.add('landscape')"
                         onerror="this.style.display='none'">`
                ).join('')}
            </div>
        </div>` : '';

    // ── أزرار الإجراء + عارض PDF حسب النوع ──
    let actionsHTML  = '';
    let viewerHTML    = '';

    if (product.type === 'books') {
        // عرض PDF inline بدل التحميل المباشر
        viewerHTML = `
            <div class="pd-pdf-section">
                <h3 class="pd-section-title">${getTranslation('read_online', 'Read Online')}</h3>
                <div class="pd-pdf-wrap">
                    <iframe src="${product.downloadUrl}#toolbar=1" class="pd-pdf-frame" loading="lazy"></iframe>
                </div>
            </div>`;
        actionsHTML = `
            <div class="pd-actions-row">
                <a href="#pdfViewer" onclick="document.querySelector('.pd-pdf-wrap').scrollIntoView({behavior:'smooth'})" class="pd-download-btn" style="--type-color:${cfg.color}">
                    📖 ${getTranslation('read_now', 'Read Now')}
                </a>
                <a href="${product.downloadUrl}" target="_blank" rel="noopener" class="pd-download-btn pd-btn--outline" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download', 'Download')}
                </a>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else if (product.type === 'articles') {
        actionsHTML = `
            <div class="pd-actions-row">
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share_article', 'Share Article')}
                </button>
            </div>`;
    } else if (product.type === 'audio') {
        actionsHTML = `
            <div class="pd-actions-row">
                <a href="${product.downloadUrl}" target="_blank" rel="noopener" class="pd-download-btn" style="--type-color:${cfg.color}">
                    ▶ ${getTranslation('listen_now', 'Listen Now')}
                </a>
                <a href="${product.downloadUrl}" target="_blank" rel="noopener" class="pd-download-btn pd-btn--outline" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download', 'Download')}
                </a>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else if (product.type === 'services') {
        actionsHTML = `
            <div class="pd-actions-row">
                <a href="${product.downloadUrl}" target="_blank" rel="noopener" class="pd-download-btn" style="--type-color:${cfg.color}">
                    💬 ${getTranslation('contact_order', 'Contact / Order')}
                </a>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else {
        actionsHTML = `
            <div class="pd-actions-row">
                <a href="${product.downloadUrl}" target="_blank" rel="noopener" class="pd-download-btn" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download_now', 'Download Now')}
                </a>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    }

    container.innerHTML = `
        <div class="pd-wrapper">
            <a href="home.html" class="pd-back-link">← Back to Home</a>

            <div class="pd-header">
                <img src="${product.image}" alt="${product.title}" class="pd-app-icon"
                     style="box-shadow: 0 0 24px ${cfg.color}44, 0 8px 32px rgba(0,0,0,0.55)"
                     onerror="this.src='https://via.placeholder.com/120/0a1628/${cfg.color.replace('#','')}?text=N'">
                <div class="pd-header-info">
                    <span class="nc-badge" style="--type-color:${cfg.color}; font-size:0.75rem; padding:4px 14px;">
                        ${cfg.icon} ${cfg.label}
                    </span>
                    <h1 class="pd-app-name">${product.title}</h1>
                    <div class="pd-badges-row">
                        <span class="pd-category-tag" style="border-color:${cfg.color}44; color:${cfg.color}">
                            ${product.category ? product.category.toUpperCase() : ''}
                        </span>
                        ${product.size       ? `<span class="pd-size-tag">💾 ${product.size}</span>` : ''}
                        ${product.author     ? `<span class="pd-size-tag">✍️ ${product.author}</span>` : ''}
                        ${product.pages      ? `<span class="pd-size-tag">📄 ${product.pages}p</span>` : ''}
                        ${product.duration   ? `<span class="pd-size-tag">⏱ ${product.duration}</span>` : ''}
                        ${product.version    ? `<span class="pd-size-tag">v${product.version}</span>` : ''}
                        ${product.read_time  ? `<span class="pd-size-tag">⏱ ${product.read_time}</span>` : ''}
                        ${product.price      ? `<span class="pd-size-tag">💰 ${product.price}</span>` : ''}
                    </div>
                    ${actionsHTML}
                    <div class="pd-copy-toast" id="pdCopyToast">✅ Link copied!</div>
                </div>
            </div>

            <div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${cfg.color}44, transparent)"></div>
            ${screenshotsHTML}
            ${screenshotsHTML ? `<div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${cfg.color}44, transparent)"></div>` : ''}

            <div class="pd-description-section">
                <h3 class="pd-section-title" style="border-color:${cfg.color}33">
                    ${cfg.icon} ${getTranslation('about', 'About')}
                </h3>
                <p class="pd-description-text">${formattedDesc}</p>
            </div>

            ${viewerHTML ? `<div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${cfg.color}44, transparent)"></div>${viewerHTML}` : ''}
        </div>

        <div class="lb-overlay" id="lbOverlay" onclick="closeLightbox()">
            <button class="lb-close" onclick="closeLightbox()">✕</button>
            <button class="lb-arrow lb-left" onclick="event.stopPropagation();shiftLightbox(-1)">❮</button>
            <img class="lb-img" id="lbImg" src="" alt="Screenshot">
            <button class="lb-arrow lb-right" onclick="event.stopPropagation();shiftLightbox(1)">❯</button>
            <div class="lb-counter" id="lbCounter"></div>
        </div>
    `;

    window._lbScreenshots = shots;
    window._lbIndex = 0;
}


// ─────────────────────────────────────────────
// 7. LIGHTBOX
// ─────────────────────────────────────────────
function openLightbox(index) {
    window._lbIndex = index;
    _renderLightbox();
    document.getElementById('lbOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeLightbox() {
    const o = document.getElementById('lbOverlay');
    if (o) o.classList.remove('active');
    document.body.style.overflow = '';
}
function shiftLightbox(dir) {
    const total = window._lbScreenshots.length;
    window._lbIndex = (window._lbIndex + dir + total) % total;
    _renderLightbox();
}
function _renderLightbox() {
    const img = document.getElementById('lbImg');
    const ctr = document.getElementById('lbCounter');
    if (img) img.src = window._lbScreenshots[window._lbIndex];
    if (ctr) ctr.textContent = (window._lbIndex + 1) + ' / ' + window._lbScreenshots.length;
}
document.addEventListener('keydown', e => {
    const o = document.getElementById('lbOverlay');
    if (!o || !o.classList.contains('active')) return;
    if (e.key === 'ArrowRight') shiftLightbox(1);
    if (e.key === 'ArrowLeft')  shiftLightbox(-1);
    if (e.key === 'Escape')     closeLightbox();
});


// ─────────────────────────────────────────────
// 8. SHARE
// ─────────────────────────────────────────────
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


// ─────────────────────────────────────────────
// TRANSLATION & THEME ENGINE & MOCK LOGIN SETUP
// ─────────────────────────────────────────────

const TRANSLATIONS = {
    EN: {
        login: "Login",
        theme: "Theme",
        brand_title: "Noxtary",
        tagline: "Noxtary is a massive digital hub built to give users fast and easy access to apps, eBooks, Minecraft mods, tools, and unique digital content — all organized in one modern experience designed for discovery, creativity, and endless exploration.",
        get_started: "Get Started",
        search_placeholder: "Search apps, mods, books...",
        tab_all: "All",
        tab_apps: "Apps",
        tab_books_articles: "Books & Articles",
        tab_mods: "Mods",
        tab_audio: "Audio",
        tab_services: "Services",
        login_title: "Cyber Authenticate",
        username: "Access Identity",
        password: "Security Code",
        sign_in: "Establish Link",
        no_account: "New operator?",
        contact_admin: "Contact admin",
        read_online: "📖 Read Online",
        read_now: "📖 Read Now",
        download: "📥 Download",
        share: "🔗 Share",
        share_article: "🔗 Share Article",
        listen_now: "▶ Listen Now",
        contact_order: "💬 Contact / Order",
        download_now: "📥 Download Now",
        about: "About",
        screenshots: "Screenshots",
        view: "View"
    },
    AR: {
        login: "تسجيل الدخول",
        theme: "المظهر",
        brand_title: "نوكستاري",
        tagline: "نوكستاري هو مركز رقمي ضخم تم بناؤه ليمنح المستخدمين وصولاً سريعًا وسهلاً إلى التطبيقات، الكتب الإلكترونية، مودات ماين كرافت، الأدوات، والمحتوى الرقمي الفريد - كل ذلك منظم في تجربة حديثة مصممة للاكتشاف والإبداع والاستكشاف اللانهائي.",
        get_started: "ابدأ الآن",
        search_placeholder: "ابحث عن التطبيقات والمودات والكتب...",
        tab_all: "الكل",
        tab_apps: "التطبيقات",
        tab_books_articles: "الكتب والمقالات",
        tab_mods: "المودات",
        tab_audio: "الصوتيات",
        tab_services: "الخدمات",
        login_title: "المصادقة السيبرانية",
        username: "هوية الدخول",
        password: "رمز الأمان",
        sign_in: "إنشاء اتصال",
        no_account: "مشغل جديد؟",
        contact_admin: "اتصل بالمسؤول",
        read_online: "📖 اقرأ أونلاين",
        read_now: "📖 اقرأ الآن",
        download: "📥 تنزيل",
        share: "🔗 مشاركة",
        share_article: "🔗 مشاركة المقال",
        listen_now: "▶ استمع الآن",
        contact_order: "💬 اتصال / طلب",
        download_now: "📥 تنزيل الآن",
        about: "حول",
        screenshots: "لقطات الشاشة",
        view: "عرض"
    }
};

const THEME_CANVAS_COLORS = {
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

function getTranslation(key, defaultVal) {
    const currentLang = localStorage.getItem('noxtary_lang') || 'EN';
    return TRANSLATIONS[currentLang]?.[key] || defaultVal || key;
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
    
    // Set direction of body
    if (lang === 'AR') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
    }

    // Translate regular nodes with data-i18n
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

    // Translate placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.setAttribute('placeholder', dict[key]);
        }
    });
}

// THEME SEQUENCE FOR INSTANT TOGGLE — only 2 themes: dark & light
const THEME_SEQUENCE = ['cyber-dark', 'neo-light'];
let currentThemeIndex = 0;

function applyTheme(themeName) {
    // Remove all theme classes first
    document.body.classList.remove('theme-cyber-dark', 'theme-neon-purple', 'theme-emerald-green', 'theme-sunset-orange', 'theme-neo-light');
    document.body.classList.add('theme-' + themeName);
    
    // Save to local storage
    localStorage.setItem('noxtary_theme', themeName);

    // Update all theme button icons on page (sun = dark mode, moon = light mode)
    document.querySelectorAll('.theme-btn-instant').forEach(btn => {
        const sunIcon  = btn.querySelector('.sun-icon');
        const moonIcon = btn.querySelector('.moon-icon');
        if (!sunIcon || !moonIcon) return;
        if (themeName === 'neo-light') {
            // Light mode → show moon (dark icon on white bg)
            sunIcon.style.display  = 'none';
            moonIcon.style.display = 'block';
        } else {
            // Dark mode → show sun
            sunIcon.style.display  = 'block';
            moonIcon.style.display = 'none';
        }
    });

    // Sync canvas colors
    if (window.spaceColors && THEME_CANVAS_COLORS[themeName]) {
        const themeColors = THEME_CANVAS_COLORS[themeName];
        Object.keys(themeColors).forEach(c => {
            window.spaceColors[c] = themeColors[c];
        });
    }
}

function setupThemeToggle() {
    const themeBtn = document.getElementById('themeBtn');
    if (!themeBtn) return;
    
    // Load saved theme or default
    const savedTheme = localStorage.getItem('noxtary_theme') || 'cyber-dark';
    currentThemeIndex = THEME_SEQUENCE.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    
    themeBtn.setAttribute('data-current', savedTheme);
    applyTheme(savedTheme);
    
    // Toggle theme on click
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentThemeIndex = (currentThemeIndex + 1) % THEME_SEQUENCE.length;
        const nextTheme = THEME_SEQUENCE[currentThemeIndex];
        applyTheme(nextTheme);
        themeBtn.setAttribute('data-current', nextTheme);
    });
}

function setupLanguageDropdown() {
    // Language dropdown
    const langBtn = document.getElementById('translateBtn');
    const langDropdown = document.getElementById('langDropdown');
    
    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
            langBtn.classList.toggle('open');
        });
        
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.getAttribute('data-lang');
                localStorage.setItem('noxtary_lang', lang);
                
                // Update active state
                document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                const currentLangEl = document.getElementById('currentLang');
                if (currentLangEl) currentLangEl.textContent = lang;
                
                applyTranslations(lang);
                
                // Redraw cards if on home page
                const activeFilter = document.querySelector('.tab-btn.active')?.dataset.filter || 'all';
                const searchVal = document.getElementById('searchInput')?.value || '';
                renderItems(activeFilter, searchVal);
                
                // Redraw details if on product details page
                loadProductDetails();
                
                langDropdown.classList.remove('show');
                langBtn.classList.remove('open');
            });
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (langDropdown && !langBtn?.contains(e.target)) {
            langDropdown.classList.remove('show');
            if (langBtn) langBtn.classList.remove('open');
        }
    });
}

function setupDropdowns() {
    setupThemeToggle();
    setupLanguageDropdown();
}

function setupLoginModal() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const modalClose = document.getElementById('modalClose');
    const loginForm = document.getElementById('loginForm');
    
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
        });
    }
    
    if (modalClose && loginModal) {
        modalClose.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
        
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('cyberUser')?.value || 'Operator';
            alert(`[CONNECTION ESTABLISHED]\nWelcome back, ${username}. Access granted.`);
            loginModal.classList.remove('active');
        });
    }
}

function setupNavbarScrollBehavior() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                if (currentScrollY > lastScrollY && currentScrollY > 60) {
                    // Scrolling down — hide navbar
                    navbar.classList.add('navbar--hidden');
                } else {
                    // Scrolling up — show navbar
                    navbar.classList.remove('navbar--hidden');
                }
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
}

function initializeCore() {
    // 1. Setup Theme
    const savedTheme = localStorage.getItem('noxtary_theme') || 'cyber-dark';
    // Clamp to valid themes in new 2-theme sequence
    const validTheme = THEME_SEQUENCE.includes(savedTheme) ? savedTheme : 'cyber-dark';
    applyTheme(validTheme);

    // 2. Setup Language
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

    // 3. Setup Triggers
    setupDropdowns();
    setupLoginModal();

    // 4. Navbar hide-on-scroll
    setupNavbarScrollBehavior();
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeCore();
    initApp();
});