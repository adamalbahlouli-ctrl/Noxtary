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
const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
    : null;

let productsData = [];
let currentSession = null;
let authListenerInitialized = false;

// ─────────────────────────────────────────────
// TYPE CONFIG — نظام الهوية البصرية
// ملاحظة: 'books' و 'articles' كلاهما يُعرضان في تبويب "books_articles"
// ─────────────────────────────────────────────
const TYPE_CONFIG = {
    apps:      { color: '#00d4ff', label: 'APP',      icon: '⬡' },
    books:     { color: '#a855f7', label: 'BOOK',     icon: '▣' },
    manga:     { color: '#e040fb', label: 'MANGA',    icon: '◉' },
    mods:      { color: '#f97316', label: 'MOD',      icon: '⚙' },
    articles:  { color: '#22c55e', label: 'ARTICLE',  icon: '✦' },
    audio:     { color: '#06b6d4', label: 'AUDIO',    icon: '♪' },
    services:  { color: '#eab308', label: 'SERVICE',  icon: '★' },
    templates: { color: '#f472b6', label: 'TEMPLATE', icon: '▦' },
};

// مجموعات التبويبات — أي data-filter يطابق أي أنواع type
const TAB_GROUPS = {
    all:            null, // كل شيء
    apps:           ['apps'],
    books_articles: ['books', 'articles'],
    mods:           ['mods'],
    audio:          ['audio'],
    services:       ['services'],
    templates:      ['templates'],
};

function getTypeConfig(type) {
    return TYPE_CONFIG[type] || { color: '#64b5f6', label: (type || '').toUpperCase(), icon: '◈' };
}


// ─────────────────────────────────────────────
// 1. INIT — جلب البيانات من Supabase
// ─────────────────────────────────────────────
async function initApp() {
    try {
        let data = null;
        if (supabaseClient) {
            const res = await supabaseClient.from(SUPABASE_TABLE).select('*');
            if (!res.error && res.data) {
                data = res.data;
            }
        }
        if (!data) {
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
            data = await response.json();
        }
        productsData = data || [];
        initHomePage();
        loadProductDetails();
    } catch (error) {
        console.error('NOXTARY — Data load error:', error);
        const grid = document.getElementById('itemsGrid');
        if (grid) grid.innerHTML = `<div class="coming-soon-card">⚠️ Could not load content. Please try again later.</div>`;
        const container = document.getElementById('product-load-container');
        if (container) container.innerHTML = `<div class="pd-error"><p>⚠️ Could not load data.</p><a href="/" class="pd-back-link">← Go Back</a></div>`;
    }
}


// ─────────────────────────────────────────────
// 2. CARD BUILDERS
// ─────────────────────────────────────────────

// ── مساعد: يبني HTML نجوم التقييم بنفس منطق صفحة المنتج ──
// المصدر: item.average_rating (رقم) + item.reviews_count (عدد)
function buildCardRatingHTML(item) {
    if (!item.average_rating) return '';
    const avg = parseFloat(item.average_rating);
    const fullStars  = Math.floor(avg);
    const halfStar   = (avg - fullStars) >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starsStr   = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    const countStr   = item.reviews_count ? `(${item.reviews_count})` : '';
    return `
        <div class="nc-card__rating">
            <span class="nc-card__stars">${starsStr}</span>
            <span class="nc-card__rating-val">${avg.toFixed(1)}</span>
            ${countStr ? `<span class="nc-card__rating-count">${countStr}</span>` : ''}
        </div>`;
}

// ── الكارت الموحد لقسم All ──────────────────
// نفس الزر "View" في كل الأنواع بدون استثناء
function getUnifiedHint(type) {
    switch (type) {
        case 'apps':      return 'Launch ready';
        case 'books':     return 'Knowledge';
        case 'articles':  return 'Insight';
        case 'mods':      return 'Game ready';
        case 'audio':     return 'Audio experience';
        case 'services':  return 'On demand';
        case 'templates': return 'Ready to use';
        default:          return 'Curated item';
    }
}

function buildUnifiedCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = `nc-unified nc-unified--${item.type || 'item'}`;
    div.style.setProperty('--type-color', cfg.color);

    // ── نجوم التقييم بنفس منطق صفحة المنتج ──
    // الحقول: item.average_rating و item.reviews_count
    let starsHTML = '';
    if (item.average_rating) {
        const avg = parseFloat(item.average_rating);
        const fullStars  = Math.floor(avg);
        const halfStar   = (avg - fullStars) >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        const starsStr   = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
        const countStr   = item.reviews_count ? `(${item.reviews_count})` : '';
        starsHTML = `
            <div class="nc-unified__rating">
                <span class="nc-unified__stars">${starsStr}</span>
                <span class="nc-unified__rating-val">${avg.toFixed(1)}</span>
                ${countStr ? `<span class="nc-unified__rating-count">${countStr}</span>` : ''}
            </div>`;
    }

    div.innerHTML = `
        <h3 class="nc-unified__title">${item.title}</h3>
        <div class="nc-unified__img-wrap">
            <img src="${item.image}" alt="${item.title}" class="nc-unified__img"
                 onerror="this.src='https://via.placeholder.com/400x280/111827/ffffff?text=N'">
            <span class="nc-unified__type-chip" style="--type-color:${cfg.color}">
                ${cfg.icon} ${cfg.label}
            </span>
        </div>
        ${starsHTML}
        <button class="nc-unified__btn nc-btn"
                style="--type-color:${cfg.color}"
                onclick="viewProduct('${item.app_id}')">
            👁 ${getTranslation('view', 'View')}
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

// ── Book / Article / Template Card — صورة كبيرة + تقييم ──────
function buildBookArticleCard(item) {
    const isBook = item.type === 'books' || item.type === 'templates';
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
            ${buildCardRatingHTML(item)}
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

// ── Mod Card — عمودي مع صورة كبيرة + تقييم ──
function buildModCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = 'nc-card nc-mod';
    div.style.setProperty('--type-color', cfg.color);
    div.innerHTML = `
        <div class="nc-card__img-wrap">
            <img src="${item.image}" alt="${item.title}" class="nc-card__cover-img"
                 onerror="this.src='https://via.placeholder.com/400x220/1a0a00/f97316?text=MOD'">
            <span class="nc-badge nc-card__cover-badge" style="--type-color:#f97316">⚙ MOD</span>
        </div>
        <div class="nc-mod__body">
            <div class="nc-mod__meta-row">
                ${item.game    ? `<span class="nc-meta-chip">🎮 ${item.game}</span>` : ''}
                ${item.version ? `<span class="nc-meta-chip">v${item.version}</span>` : ''}
            </div>
            <h3 class="nc-card__title">${item.title}</h3>
            ${buildCardRatingHTML(item)}
            <div class="nc-card__actions">
                <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#f97316"
                        onclick="viewProduct('${item.app_id}')">
                    👁 ${getTranslation('view', 'View')}
                </button>
            </div>
        </div>
    `;
    return div;
}

// ── Audio Card — صورة كبيرة مربعة + تقييم ──
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
            ${buildCardRatingHTML(item)}
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

// ── Service Card — عمودي مع صورة كبيرة + تقييم ──
function buildServiceCard(item) {
    const cfg = getTypeConfig(item.type);
    const div = document.createElement('div');
    div.className = 'nc-card nc-service';
    div.style.setProperty('--type-color', cfg.color);
    div.innerHTML = `
        <div class="nc-card__img-wrap">
            <img src="${item.image}" alt="${item.title}" class="nc-card__cover-img"
                 onerror="this.src='https://via.placeholder.com/400x220/1a1500/eab308?text=★'">
            <span class="nc-badge nc-card__cover-badge" style="--type-color:#eab308">★ SERVICE</span>
        </div>
        <div class="nc-service__body">
            <div class="nc-service__meta-row">
                ${item.price ? `<span class="nc-meta-chip">💰 ${item.price}</span>` : ''}
            </div>
            <h3 class="nc-card__title">${item.title}</h3>
            ${buildCardRatingHTML(item)}
            <div class="nc-card__actions">
                <button class="nc-btn nc-btn--primary nc-btn--full" style="--type-color:#eab308"
                        onclick="viewProduct('${item.app_id}')">
                    👁 ${getTranslation('view', 'View')}
                </button>
            </div>
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
    } else if (filter === 'books_articles' || filter === 'templates') {
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
                case 'apps':      card = buildAppCard(item);          break;
                case 'books':
                case 'articles':
                case 'templates': card = buildBookArticleCard(item);  break;
                case 'mods':      card = buildModCard(item);          break;
                case 'audio':     card = buildAudioCard(item);        break;
                case 'services':  card = buildServiceCard(item);      break;
                default:          card = buildFallbackCard(item);
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
            renderItemsAnimated(btn.dataset.filter, searchInput ? searchInput.value : '');
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const activeFilter = document.querySelector('.tab-btn.active')?.dataset.filter || 'all';
            renderItemsAnimated(activeFilter, e.target.value);
        });
    }

    renderItems();
    initScrollToTop();
    initCategoryDragScroll();
}


// ─────────────────────────────────────────────
// 5. ROUTING — كل الكاردات تستخدم هذا فقط
// ─────────────────────────────────────────────
function viewProduct(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + productId;
}


// ─────────────────────────────────────────────
// 6. PRODUCT PAGE — Download Handler
// ─────────────────────────────────────────────
async function handleDownloadClick(appId, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ ...';
    btnElement.style.pointerEvents = 'none';

    const { data, error } = await supabaseClient.rpc('get_download_url', { p_app_id: appId });

    btnElement.innerHTML = originalText;
    btnElement.style.pointerEvents = 'auto';

    if (error) {
        if (error.message.includes('اشتراك مطلوب')) {
            alert(getTranslation('premium_required', 'This content is premium. Please subscribe to download.'));
        } else if (error.message.includes('تسجيل الدخول')) {
            alert(getTranslation('login_required', 'Please sign in first.'));
            document.getElementById('loginModal')?.classList.add('active');
        } else {
            alert(getTranslation('generic_error', 'Something went wrong. Please try again.'));
        }
        return;
    }

    if (data) {
        window.open(data, '_blank', 'noopener');
    } else {
        alert(getTranslation('link_unavailable', 'Link is currently unavailable.'));
    }
}

// ─────────────────────────────────────────────
// 6b. MANGA — Chapter Read Handler
// نفس نمط handleDownloadClick لكن يستدعي get_chapter_file_url
// ─────────────────────────────────────────────
async function handleChapterRead(chapterId, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ ...';
    btnElement.style.pointerEvents = 'none';

    const { data, error } = await supabaseClient.rpc('get_chapter_file_url', { p_chapter_id: chapterId });

    btnElement.innerHTML = originalText;
    btnElement.style.pointerEvents = 'auto';

    if (error) {
        if (error.message.includes('اشتراك مطلوب')) {
            alert(getTranslation('premium_required_read', 'This content is premium. Please subscribe to read.'));
        } else if (error.message.includes('تسجيل الدخول')) {
            alert(getTranslation('login_required', 'Please sign in first.'));
            document.getElementById('loginModal')?.classList.add('active');
        } else {
            alert(getTranslation('generic_error', 'Something went wrong. Please try again.'));
        }
        return;
    }

    if (!data) {
        alert(getTranslation('link_unavailable', 'Link is currently unavailable.'));
        return;
    }

    // استخدام عارض PDF المدمج إن وُجد، وإلا فتح تبويب جديد
    const pdfFrame = document.getElementById('mangaPdfFrame');
    const pdfSection = document.getElementById('mangaPdfSection');
    if (pdfFrame && pdfSection) {
        pdfFrame.src = data + '#toolbar=1';
        pdfSection.style.display = 'block';
        pdfSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // تحديث عنوان الفصل النشط
        const activeTitle = document.getElementById('mangaPdfActiveTitle');
        if (activeTitle) {
            const chapterBtn = btnElement.closest('.manga-chapter-card');
            const titleEl = chapterBtn?.querySelector('.manga-chapter-title');
            if (titleEl) activeTitle.textContent = titleEl.textContent;
        }
    } else {
        window.open(data, '_blank', 'noopener');
    }
}

// ─────────────────────────────────────────────
// 6b-2. MANGA — Chapter Download Handler
// نفس نمط handleChapterRead لكن يستدعي get_chapter_download_url
// ─────────────────────────────────────────────
async function handleChapterDownload(chapterId, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ ...';
    btnElement.style.pointerEvents = 'none';

    const { data, error } = await supabaseClient.rpc('get_chapter_download_url', { p_chapter_id: chapterId });

    btnElement.innerHTML = originalText;
    btnElement.style.pointerEvents = 'auto';

    if (error) {
        if (error.message.includes('اشتراك مطلوب')) {
            alert(getTranslation('premium_required', 'This content is premium. Please subscribe to download.'));
        } else if (error.message.includes('تسجيل الدخول')) {
            alert(getTranslation('login_required', 'Please sign in first.'));
            document.getElementById('loginModal')?.classList.add('active');
        } else {
            alert(getTranslation('generic_error', 'Something went wrong. Please try again.'));
        }
        return;
    }

    if (!data) {
        alert(getTranslation('link_unavailable', 'Link is currently unavailable.'));
        return;
    }

    window.open(data, '_blank', 'noopener');
}

// ─────────────────────────────────────────────
// 6e. SUBSCRIPTION — Lemon Squeezy Checkout Handler
// ─────────────────────────────────────────────
async function handleSubscribeClick() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        alert('يجب تسجيل الدخول أولاً للشراء');
        return;
    }

    const baseCheckoutUrl = 'https://noxtary.lemonsqueezy.com/checkout/buy/9cc9d855-a775-4e03-8e2c-8f7bf567a2d1';

    const checkoutUrl = `${baseCheckoutUrl}?checkout[email]=${encodeURIComponent(session.user.email)}&checkout[custom][user_id]=${session.user.id}`;

    window.location.href = checkoutUrl;
}
window.handleSubscribeClick = handleSubscribeClick;

// ─────────────────────────────────────────────
// 6f. SUBSCRIPTION — Check if current user is subscribed to a product_group
// ─────────────────────────────────────────────
async function checkSubscriptionStatus(productGroup) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user || !productGroup) return false;

    const { data, error } = await supabaseClient
        .from('subscriptions')
        .select('status, expires_at')
        .eq('user_id', session.user.id)
        .eq('product_group', productGroup)
        .eq('status', 'active')
        .maybeSingle();

    if (error || !data) return false;

    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;

    return true;
}

// ─────────────────────────────────────────────
// 7. PRODUCT PAGE — Detail Loader
// ─────────────────────────────────────────────
async function loadProductDetails() {
    const container = document.getElementById('product-load-container');
    if (!container) return;

    const params     = new URLSearchParams(window.location.search);
    const selectedId = params.get('id');

    if (!selectedId) {
        container.innerHTML = `<div class="pd-error"><p>No product selected.</p><a href="/" class="pd-back-link">← Go Back</a></div>`;
        return;
    }

    const product = productsData.find(p => p.app_id === selectedId);
    if (!product) {
        container.innerHTML = `<div class="pd-error"><p>Product not found.</p><a href="/" class="pd-back-link">← Go Back</a></div>`;
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

    // ── هل هذا المنتج من نوع مانجا؟ ──
    const isManga = product.type === 'books' && (product.category || '').toLowerCase() === 'manga';

    // إذا كان مانجا، استبدل cfg بإعدادات مانجا
    const effectiveCfg = isManga ? TYPE_CONFIG.manga : cfg;

    // ── التحقق من حالة الاشتراك إذا كان المنتج مرتبطًا بـ product_group ──
    let isSubscribed = false;
    if (product.product_group) {
        isSubscribed = await checkSubscriptionStatus(product.product_group);
    }

    // ── أزرار الإجراء + عارض PDF حسب النوع ──
    // مُعرَّفة هنا بقيم افتراضية فارغة لضمان توفرها في كل نطاقات الشرط
    let actionsHTML      = '';
    let viewerHTML       = '';
    let mangaSectionHTML = '';

    // ── هل هذا المنتج من نوع قالب؟ ──
    const isTemplate = product.type === 'templates';

    if (isManga) {
        // للمانجا: زر الاشتراك (أو "مشترك بالفعل") وزر المشاركة
        const subscribeBtn = isSubscribed
            ? `<button class="pd-download-btn pd-btn--subscribed" disabled style="background:#475569; color:#cbd5e1; cursor:default; opacity:0.8;">✓ Subscribed</button>`
            : `<button onclick="handleSubscribeClick()" class="pd-download-btn pd-subscribe-btn" style="--type-color:${effectiveCfg.color}">⭐ ${getTranslation('subscribe', 'Subscribe')}</button>`;
        actionsHTML = `
            <div class="pd-actions-row">
                ${subscribeBtn}
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${effectiveCfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;

        // عارض PDF للمانجا (مخفي بالبداية، يظهر عند الضغط على فصل)
        viewerHTML = `
            <div class="pd-pdf-section" id="mangaPdfSection" style="display:none">
                <div class="manga-pdf-header">
                    <h3 class="pd-section-title" style="border-color:${effectiveCfg.color}33; margin-bottom:4px">
                        ◉ Reading: <span id="mangaPdfActiveTitle">—</span>
                    </h3>
                    <button class="manga-pdf-close" onclick="document.getElementById('mangaPdfSection').style.display='none'; document.getElementById('mangaPdfFrame').src=''">✕ Close</button>
                </div>
                <div class="pd-pdf-wrap">
                    <iframe id="mangaPdfFrame" src="" class="pd-pdf-frame" loading="lazy"></iframe>
                </div>
            </div>`;
        // قسم الفصول (placeholder، يُملأ بعد async fetch)
        mangaSectionHTML = `
            <div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${effectiveCfg.color}44, transparent)"></div>
            <div class="manga-chapters-section" id="mangaChaptersSection">
                <h3 class="pd-section-title" style="border-color:${effectiveCfg.color}33">
                    ◉ Chapters
                </h3>
                <div class="manga-chapters-grid" id="mangaChaptersGrid">
                    <div class="manga-chapters-loading">⏳ Loading chapters...</div>
                </div>
            </div>`;
    } else if (product.type === 'books') {
        // كتاب عادي: لا عارض تلقائي — يُبنى فقط عند الضغط على "Read Now" عبر handleReadOnline
        actionsHTML = `
            <div class="pd-actions-row">
                <button onclick="handleReadOnline('${product.app_id}', '${product.type}', this)" class="pd-download-btn" style="--type-color:${cfg.color}">
                    📖 ${getTranslation('read_now', 'Read Now')}
                </button>
                <button onclick="handleDownloadClick('${product.app_id}', this)" class="pd-download-btn pd-btn--outline" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download', 'Download')}
                </button>
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
                <button onclick="handleReadOnline('${product.app_id}', '${product.type}', this)" class="pd-download-btn" style="--type-color:${cfg.color}">
                    ${getTranslation('listen_now', '▶ Listen')}
                </button>
                <button onclick="handleDownloadClick('${product.app_id}', this)" class="pd-download-btn pd-btn--outline" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download', 'Download')}
                </button>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else if (product.type === 'services') {
        actionsHTML = `
            <div class="pd-actions-row">
                <button onclick="handleDownloadClick('${product.app_id}', this)" class="pd-download-btn" style="--type-color:${cfg.color}">
                    💬 ${getTranslation('contact_order', 'Contact / Order')}
                </button>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else if (isTemplate) {
        // القوالب: مجانية دائماً — زر مشاركة فقط، والنسخ تُعرض أسفل في قسم منفصل
        actionsHTML = `
            <div class="pd-actions-row">
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    } else {
        actionsHTML = `
            <div class="pd-actions-row">
                <button onclick="handleDownloadClick('${product.app_id}', this)" class="pd-download-btn" style="--type-color:${cfg.color}">
                    📥 ${getTranslation('download_now', 'Download Now')}
                </button>
                <button class="pd-share-btn pd-share-main" onclick="shareProduct('${(product.title||'').replace(/'/g,"\\'")}')" style="--type-color:${cfg.color}">
                    🔗 ${getTranslation('share', 'Share')}
                </button>
            </div>`;
    }

    // ── شارة FREE للقوالب ──
    const freeBadgeHTML = isTemplate
        ? `<span class="pd-free-badge">✦ FREE</span>`
        : '';

    // ── قسم نسخ القالب placeholder (يُملأ async بعد التصيير) ──
    const templateVariantsSectionHTML = isTemplate ? `
        <div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${cfg.color}44, transparent)"></div>
        <div class="template-variants-section" id="templateVariantsSection">
            <h3 class="pd-section-title" style="border-color:${cfg.color}33">
                ▦ Available Formats
            </h3>
            <div class="template-variants-grid" id="templateVariantsGrid">
                <div class="manga-chapters-loading">⏳ Loading variants...</div>
            </div>
        </div>` : '';

    container.innerHTML = `
        <div class="pd-wrapper">
            <a href="/" class="pd-back-link">← Back to Home</a>

            <div class="pd-header">
                <img src="${product.image}" alt="${product.title}" class="pd-app-icon"
                     style="box-shadow: 0 0 24px ${effectiveCfg.color}44, 0 8px 32px rgba(0,0,0,0.55)"
                     onerror="this.src='https://via.placeholder.com/120/0a1628/${effectiveCfg.color.replace('#','')}?text=N'">
                <div class="pd-header-info">
                    <div class="pd-type-badges-row">
                        <span class="nc-badge" style="--type-color:${effectiveCfg.color}; font-size:0.75rem; padding:4px 14px;">
                            ${effectiveCfg.icon} ${effectiveCfg.label}
                        </span>
                        ${freeBadgeHTML}
                    </div>
                    <h1 class="pd-app-name">${product.title}</h1>
                    <div class="pd-badges-row">
                        <span class="pd-category-tag" style="border-color:${effectiveCfg.color}44; color:${effectiveCfg.color}">
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

            <div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${effectiveCfg.color}44, transparent)"></div>
            ${screenshotsHTML}
            ${screenshotsHTML ? `<div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${effectiveCfg.color}44, transparent)"></div>` : ''}

            <div class="pd-description-section">
                <h3 class="pd-section-title" style="border-color:${effectiveCfg.color}33">
                    ${effectiveCfg.icon} ${getTranslation('about', 'About')}
                </h3>
                <p class="pd-description-text">${formattedDesc}</p>
            </div>

            ${mangaSectionHTML}

            ${templateVariantsSectionHTML}

            ${viewerHTML ? `<div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${effectiveCfg.color}44, transparent)"></div>${viewerHTML}` : ''}

            <div class="pd-divider" style="background: linear-gradient(90deg, transparent, ${effectiveCfg.color}44, transparent)"></div>

            <section class="reviews-section" id="reviewsSection">
                <h3 class="reviews-title pd-section-title" style="border-color:${effectiveCfg.color}33">
                    ⭐ ${getTranslation('reviews', 'Reviews')}
                    <span class="reviews-summary">
                        ${product.average_rating ? `<span class="reviews-avg" id="avgRatingDisplay">★ ${parseFloat(product.average_rating).toFixed(1)}</span>` : '<span id="avgRatingDisplay"></span>'}
                        ${product.reviews_count ? `<span class="reviews-count" id="reviewsCountDisplay">(${product.reviews_count})</span>` : '<span id="reviewsCountDisplay"></span>'}
                    </span>
                </h3>

                <div id="reviewFormContainer" class="review-form" style="display:none;">
                    <div class="star-input" id="starInput">
                        <span data-value="1">☆</span>
                        <span data-value="2">☆</span>
                        <span data-value="3">☆</span>
                        <span data-value="4">☆</span>
                        <span data-value="5">☆</span>
                    </div>
                    <textarea id="reviewCommentInput" class="review-textarea" placeholder="${getTranslation('review_comment_placeholder', 'Write your comment (optional)...')}"></textarea>
                    <button id="submitReviewBtn" class="review-submit-btn" style="--type-color:${effectiveCfg.color}">${getTranslation('review_submit', 'Submit Review')}</button>
                </div>

                <p id="reviewLoginPrompt" class="review-login-prompt" style="display:none;">
                    ${getTranslation('review_login_prompt', 'Sign in to rate this product.')}
                </p>

                <div id="reviewsList" class="reviews-list"></div>
            </section>
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

    // ── إذا كانت مانجا: جلب الفصول بشكل async وعرضها ──
    if (isManga) {
        loadMangaChapters(product.id, effectiveCfg.color);
    }

    // ── إذا كان قالب: جلب النسخ بشكل async وعرضها ──
    if (isTemplate) {
        loadTemplateVariants(product.id, cfg.color);
    }

    // ── تحميل التقييمات وتهيئة نموذج التقييم ──
    loadReviews(product.id);
    initReviewForm(product.id);
}

// ─────────────────────────────────────────────
// 6c. REGULAR BOOK / AUDIO — Read/Listen Online (lazy, on-demand)
// يحقن عارض PDF للكتب أو مشغّل صوتي للصوتيات بعد نجاح استدعاء RPC
// ─────────────────────────────────────────────
async function handleReadOnline(appId, productType, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ ...';
    btnElement.style.pointerEvents = 'none';

    const { data, error } = await supabaseClient.rpc('get_view_url', { p_app_id: appId });

    btnElement.innerHTML = originalText;
    btnElement.style.pointerEvents = 'auto';

    if (error) {
        if (error.message.includes('اشتراك مطلوب')) {
            alert(getTranslation('premium_required_read', 'This content is premium. Please subscribe to read.'));
        } else if (error.message.includes('تسجيل الدخول')) {
            alert(getTranslation('login_required', 'Please sign in first.'));
            document.getElementById('loginModal')?.classList.add('active');
        } else {
            alert(getTranslation('generic_error', 'Something went wrong. Please try again.'));
        }
        return;
    }

    if (!data) {
        alert(getTranslation('link_unavailable', 'Link is currently unavailable.'));
        return;
    }

    // حقن العارض ديناميكيًا (يُنشأ مرة واحدة فقط، يُحدَّث إن وُجد)
    let viewerContainer = document.getElementById('inlinePdfViewer');
    if (!viewerContainer) {
        viewerContainer = document.createElement('div');
        viewerContainer.id = 'inlinePdfViewer';
        viewerContainer.className = 'pd-pdf-section';
        btnElement.closest('.pd-actions-row')?.insertAdjacentElement('afterend', viewerContainer);
    }

    if (productType === 'audio') {
        // ── مشغّل صوتي HTML5 للصوتيات ──
        viewerContainer.innerHTML = `
            <h3 class="pd-section-title">▶ ${getTranslation('now_playing', 'Now Playing')}</h3>
            <div class="pd-pdf-wrap">
                <audio controls autoplay style="width:100%;" src="${data}">
                    Your browser does not support the audio element.
                </audio>
            </div>`;
    } else {
        // ── عارض PDF للكتب وغيرها ──
        const existingIframe = viewerContainer.querySelector('iframe');
        if (existingIframe) {
            existingIframe.src = `${data}#toolbar=1`;
        } else {
            viewerContainer.innerHTML = `
                <h3 class="pd-section-title">📖 ${getTranslation('read_online', 'Read Online')}</h3>
                <div class="pd-pdf-wrap">
                    <iframe src="${data}#toolbar=1" class="pd-pdf-frame" loading="lazy"></iframe>
                </div>`;
        }
    }

    viewerContainer.scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// 6d. MANGA — Chapters Loader
// ─────────────────────────────────────────────
async function loadMangaChapters(mangaProductId, accentColor) {
    const grid = document.getElementById('mangaChaptersGrid');
    if (!grid) return;

    const { data: chapters, error } = await supabaseClient
        .from('manga_chapters')
        .select('*')
        .eq('manga_app_id', mangaProductId)
        .order('chapter_number', { ascending: true });

    if (error) {
        grid.innerHTML = `<div class="manga-chapters-error">⚠️ Could not load chapters. Please try again later.</div>`;
        console.error('NOXTARY — Manga chapters load error:', error);
        return;
    }

    if (!chapters || chapters.length === 0) {
        grid.innerHTML = `<div class="manga-chapters-empty">📭 No chapters available yet. Check back soon!</div>`;
        return;
    }

    grid.innerHTML = chapters.map(ch => `
        <div class="manga-chapter-card" data-chapter-id="${ch.id}">
            <div class="manga-chapter-cover-wrap">
                <img
                    src="${ch.cover_image || ''}"
                    alt="Chapter ${ch.chapter_number} cover"
                    class="manga-chapter-cover"
                    onerror="this.src='https://via.placeholder.com/180x260/0d0020/e040fb?text=Ch.${ch.chapter_number}'"
                    loading="lazy"
                >
                <div class="manga-chapter-number-badge">Ch.${ch.chapter_number}</div>
            </div>
            <div class="manga-chapter-info">
                <p class="manga-chapter-title">Chapter ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}</p>
                <div class="manga-chapter-btns">
                    <button
                        class="manga-read-btn"
                        style="--manga-color:${accentColor}"
                        onclick="handleChapterRead(${ch.id}, this)"
                    >
                        📖 Read Now
                    </button>
                    <button
                        class="manga-read-btn manga-download-btn"
                        style="--manga-color:${accentColor}"
                        onclick="handleChapterDownload(${ch.id}, this)"
                    >
                        📥 Download
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}


// ─────────────────────────────────────────────
// 6e-2. TEMPLATES — Variants Loader
// يجلب نسخ القالب (Letter, A4, إلخ) ويعرض بطاقة لكل نسخة
// ─────────────────────────────────────────────
async function loadTemplateVariants(productId, accentColor) {
    const grid = document.getElementById('templateVariantsGrid');
    if (!grid) return;

    const { data: variants, error } = await supabaseClient
        .from('template_variants')
        .select('*')
        .eq('app_id', productId);

    if (error) {
        grid.innerHTML = `<div class="manga-chapters-error">⚠️ Could not load variants. Please try again later.</div>`;
        console.error('NOXTARY — Template variants load error:', error);
        return;
    }

    if (!variants || variants.length === 0) {
        grid.innerHTML = `<div class="manga-chapters-empty">📭 No variants available yet. Check back soon!</div>`;
        return;
    }

    grid.innerHTML = variants.map(v => `
        <div class="template-variant-card" style="--tv-color:${accentColor}">
            <div class="template-variant-icon">▦</div>
            <p class="template-variant-name">${v.variant_name}</p>
            <div class="template-variant-actions">
                <button class="template-variant-btn template-variant-btn--view"
                        style="--tv-color:${accentColor}"
                        onclick="window.open('${v.view_url}', '_blank', 'noopener')">
                    📖 View
                </button>
                <button class="template-variant-btn template-variant-btn--download"
                        style="--tv-color:${accentColor}"
                        onclick="window.open('${v.download_url}', '_blank', 'noopener')">
                    📥 Download
                </button>
            </div>
        </div>
    `).join('');
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
// REVIEWS SYSTEM
// ─────────────────────────────────────────────

/**
 * تنظيف النص من HTML لمنع XSS عند حقن نصوص المستخدم في DOM
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * جلب التقييمات من Supabase وعرضها
 */
async function loadReviews(appId) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    container.innerHTML = '<div class="reviews-loading">⏳</div>';

    const { data: reviews, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Error loading reviews:', error);
        container.innerHTML = '';
        return;
    }

    renderReviews(reviews);
}

/**
 * عرض قائمة التقييمات في DOM
 */
function renderReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `<p class="no-reviews">${getTranslation('no_reviews', 'No reviews yet. Be the first to review!')}</p>`;
        return;
    }

    container.innerHTML = reviews.map(r => {
        const starsHtml = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const dateStr = new Date(r.created_at).toLocaleDateString();
        const commentHtml = r.comment
            ? `<p class="review-comment">${escapeHtml(r.comment)}</p>`
            : '';
        return `
        <div class="review-card">
            <div class="review-header">
                <span class="review-user">${escapeHtml(r.user_name || 'User')}</span>
                <span class="review-stars" aria-label="${r.rating} out of 5 stars">${starsHtml}</span>
            </div>
            ${commentHtml}
            <span class="review-date">${dateStr}</span>
        </div>`;
    }).join('');
}

/**
 * إرسال تقييم جديد أو تحديث تقييم موجود (upsert)
 */
async function submitReview(appId, rating, comment) {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        alert(getTranslation('login_required', 'Please sign in first.'));
        return;
    }

    const userName = session.user.user_metadata?.full_name
        || session.user.user_metadata?.name
        || session.user.email
        || 'User';

    const { error } = await supabaseClient
        .from('reviews')
        .upsert({
            app_id: appId,
            user_id: session.user.id,
            user_name: userName,
            rating: rating,
            comment: comment || null
        }, { onConflict: 'app_id,user_id' });

    if (error) {
        console.error('Error submitting review:', error);
        alert(getTranslation('review_error', 'An error occurred while submitting your review.'));
        return;
    }

    // إعادة تحميل التقييمات وتحديث بيانات المنتج
    await loadReviews(appId);
    loadProductDetails();
}

/**
 * تحديث حالة النجوم المرئية في نموذج التقييم
 */
function updateReviewStars(stars, count) {
    stars.forEach((star, index) => {
        if (index < count) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
}

/**
 * تهيئة نموذج التقييم: إظهار/إخفاء حسب حالة تسجيل الدخول،
 * وربط تفاعل النجوم وزر الإرسال
 */
function initReviewForm(productId) {
    const formContainer = document.getElementById('reviewFormContainer');
    const loginPrompt  = document.getElementById('reviewLoginPrompt');

    // تحديث حالة الجلسة → إظهار الفورم أو الرسالة
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
            if (formContainer) formContainer.style.display = 'block';
            if (loginPrompt)  loginPrompt.style.display  = 'none';
        } else {
            if (formContainer) formContainer.style.display = 'none';
            if (loginPrompt)  loginPrompt.style.display  = 'block';
        }
    });

    // تفاعل النجوم
    let selectedRating = 0;
    const starInput = document.getElementById('starInput');
    if (starInput) {
        const stars = Array.from(starInput.querySelectorAll('span'));

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                updateReviewStars(stars, selectedRating);
            });
            star.addEventListener('mouseover', () => {
                updateReviewStars(stars, index + 1);
            });
        });

        starInput.addEventListener('mouseleave', () => {
            updateReviewStars(stars, selectedRating);
        });
    }

    // زر الإرسال
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (selectedRating === 0) {
                alert(getTranslation('review_select_stars', 'Please select a star rating first.'));
                return;
            }
            const comment = (document.getElementById('reviewCommentInput')?.value || '').trim();
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ ...';
            try {
                await submitReview(productId, selectedRating, comment);
                // إعادة تعيين النموذج بعد النجاح
                selectedRating = 0;
                const starInputEl = document.getElementById('starInput');
                if (starInputEl) {
                    updateReviewStars(Array.from(starInputEl.querySelectorAll('span')), 0);
                }
                const commentInput = document.getElementById('reviewCommentInput');
                if (commentInput) commentInput.value = '';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
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
        tagline: "A premium digital platform bringing apps, ebooks, mods, audio, and services together in one elegant, fast experience designed for discovery.",
        get_started: "Get Started",
        search_placeholder: "Search apps, mods, books...",
        tab_all: "All",
        tab_apps: "Apps",
        tab_books_articles: "Books & Articles",
        tab_mods: "Mods",
        tab_audio: "Audio",
        tab_services: "Services",
        tab_templates: "Templates",
        login_title: "Cyber Authenticate",
        username: "Access Identity",
        password: "Security Code",
        sign_in: "Establish Link",
        no_account: "New operator?",
        contact_admin: "Contact admin",
        read_online: "📖 Read Online",
        now_playing: "Now Playing",
        read_now: "📖 Read Now",
        download: "📥 Download",
        share: "🔗 Share",
        share_article: "🔗 Share Article",
        listen_now: "▶ Listen",
        contact_order: "💬 Contact / Order",
        download_now: "📥 Download Now",
        about: "About",
        screenshots: "Screenshots",
        view: "View",
        subscribe: "Subscribe",
        terms_of_service: "Terms of Service",
        privacy_policy: "Privacy Policy",
        refund_policy: "Refund Policy",
        contact_us: "Contact Us",
        sign_in_google: "Sign in with Google",
        logout: "تسجيل الخروج / Logout",
        all_rights_reserved: "© 2026 Noxtary. All rights reserved.",
        premium_required: "This content is premium. Please subscribe to download.",
        premium_required_read: "This content is premium. Please subscribe to read.",
        login_required: "Please sign in first.",
        generic_error: "Something went wrong. Please try again.",
        link_unavailable: "Link is currently unavailable.",
        reviews: "Reviews",
        no_reviews: "No reviews yet. Be the first to review!",
        review_login_prompt: "Sign in to rate this product.",
        review_submit: "Submit Review",
        review_select_stars: "Please select a star rating first.",
        review_error: "An error occurred while submitting your review."
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
        tab_templates: "القوالب",
        login_title: "المصادقة السيبرانية",
        username: "هوية الدخول",
        password: "رمز الأمان",
        sign_in: "إنشاء اتصال",
        no_account: "مشغل جديد؟",
        contact_admin: "اتصل بالمسؤول",
        read_online: "📖 اقرأ أونلاين",
        now_playing: "قيد التشغيل الآن",
        read_now: "📖 اقرأ الآن",
        download: "📥 تنزيل",
        share: "🔗 مشاركة",
        share_article: "🔗 مشاركة المقال",
        listen_now: "▶ استمع",
        contact_order: "💬 اتصال / طلب",
        download_now: "📥 تنزيل الآن",
        about: "حول",
        screenshots: "لقطات الشاشة",
        view: "عرض",
        subscribe: "اشتراك",
        terms_of_service: "شروط الخدمة",
        privacy_policy: "سياسة الخصوصية",
        refund_policy: "سياسة الاسترجاع",
        contact_us: "اتصل بنا",
        sign_in_google: "تسجيل الدخول بـ Google",
        logout: "تسجيل الخروج",
        all_rights_reserved: "© 2026 نوكستاري. جميع الحقوق محفوظة.",
        premium_required: "هذا المحتوى مدفوع. يرجى الاشتراك أولًا للتحميل.",
        premium_required_read: "هذا المحتوى مدفوع. يرجى الاشتراك أولًا للقراءة.",
        login_required: "يرجى تسجيل الدخول أولًا.",
        generic_error: "حدث خطأ، حاول مرة أخرى.",
        link_unavailable: "الرابط غير متوفر حاليًا.",
        reviews: "التقييمات",
        no_reviews: "لا توجد تقييمات بعد. كن أول من يقيّم!",
        review_login_prompt: "سجّل دخولك لتتمكن من تقييم هذا المنتج.",
        review_submit: "إرسال التقييم",
        review_select_stars: "يرجى اختيار تقييم بالنجوم أولاً.",
        review_error: "حدث خطأ أثناء إرسال التقييم."
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

// ─────────────────────────────────────────────
// SYSTEM THEME AUTO-DETECTION
// Automatically adapts site theme to the user's OS/device preferences
// ─────────────────────────────────────────────
function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'neo-light';
    }
    return 'cyber-dark';
}

function applyTheme(themeName) {
    // Remove all theme classes first
    document.body.classList.remove('theme-cyber-dark', 'theme-neon-purple', 'theme-emerald-green', 'theme-sunset-orange', 'theme-neo-light');
    document.body.classList.add('theme-' + themeName);
    localStorage.setItem('noxtary_theme', themeName);

    // Sync canvas colors
    if (window.spaceColors && THEME_CANVAS_COLORS[themeName]) {
        const themeColors = THEME_CANVAS_COLORS[themeName];
        Object.keys(themeColors).forEach(c => {
            window.spaceColors[c] = themeColors[c];
        });
    }
}

function setupSystemThemeDetection() {
    // Detect & apply initial OS preference
    const initialTheme = getSystemTheme();
    applyTheme(initialTheme);

    // Listen for live system theme changes (e.g. macOS/Windows/Android Dark/Light toggle)
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                applyTheme(e.matches ? 'cyber-dark' : 'neo-light');
            });
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener((e) => {
                applyTheme(e.matches ? 'cyber-dark' : 'neo-light');
            });
        }
    }
}

function setupLanguageDropdown() {
    // Language dropdown
    const langBtn = document.getElementById('translateBtn');
    const langDropdown = document.getElementById('langDropdown');
    
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle language directly on click
            const currentLang = localStorage.getItem('noxtary_lang') || 'EN';
            const nextLang = currentLang === 'EN' ? 'AR' : 'EN';
            localStorage.setItem('noxtary_lang', nextLang);
            
            // Update active state
            document.querySelectorAll('.lang-option').forEach(o => {
                if (o.getAttribute('data-lang') === nextLang) {
                    o.classList.add('active');
                } else {
                    o.classList.remove('active');
                }
            });
            
            const currentLangEl = document.getElementById('currentLang');
            if (currentLangEl) currentLangEl.textContent = nextLang;
            
            applyTranslations(nextLang);
            
            // Redraw cards if on home page
            const activeFilter = document.querySelector('.tab-btn.active')?.dataset.filter || 'all';
            const searchVal = document.getElementById('searchInput')?.value || '';
            renderItems(activeFilter, searchVal);
            
            // Redraw details if on product details page
            loadProductDetails();
            
            if (langDropdown) {
                langDropdown.classList.remove('show');
            }
            langBtn.classList.remove('open');
        });
        
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
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
                
                if (langDropdown) {
                    langDropdown.classList.remove('show');
                }
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
    setupLanguageDropdown();
}

function positionUserDropdown() {
    const loginBtn = document.getElementById('loginBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!loginBtn || !dropdown) return;

    const rect = loginBtn.getBoundingClientRect();
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

    dropdown.style.top = `${rect.bottom + 8}px`;
    if (isRtl) {
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.right = 'auto';
    } else {
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.left = 'auto';
    }
}

function toggleUserDropdown() {
    const loginBtn = document.getElementById('loginBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!loginBtn || !dropdown) return;

    if (!currentSession || !currentSession.user) {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('active');
        return;
    }

    positionUserDropdown();
    dropdown.classList.toggle('show');
}

function setupLoginModal() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const modalClose = document.getElementById('modalClose');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!loginBtn) console.warn("NOXTARY Auth: Element #loginBtn not found on this page.");
    if (!loginModal) console.warn("NOXTARY Auth: Element #loginModal not found on this page.");
    if (!modalClose) console.warn("NOXTARY Auth: Element #modalClose not found on this page.");
    if (!googleSignInBtn) console.warn("NOXTARY Auth: Element #googleSignInBtn not found on this page.");
    if (!logoutBtn) console.warn("NOXTARY Auth: Element #logoutBtn not found on this page.");

    if (loginBtn) {
        if (!loginBtn.dataset.listenerInitialized) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentSession && currentSession.user) {
                    toggleUserDropdown();
                } else {
                    if (loginModal) {
                        loginModal.classList.add('active');
                    }
                }
            });
            loginBtn.dataset.listenerInitialized = "true";
        }
    }

    if (logoutBtn && !logoutBtn.dataset.listenerInitialized) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            signOut();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        });
        logoutBtn.dataset.listenerInitialized = "true";
    }
    
    if (modalClose && loginModal) {
        if (!modalClose.dataset.listenerInitialized) {
            modalClose.addEventListener('click', () => {
                loginModal.classList.remove('active');
            });
            modalClose.dataset.listenerInitialized = "true";
        }
        
        if (!loginModal.dataset.listenerInitialized) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.classList.remove('active');
                }
            });
            loginModal.dataset.listenerInitialized = "true";
        }
    }
    
    if (googleSignInBtn) {
        if (!googleSignInBtn.dataset.listenerInitialized) {
            googleSignInBtn.addEventListener('click', () => {
                signInWithGoogle();
            });
            googleSignInBtn.dataset.listenerInitialized = "true";
        }
    }

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            if (loginBtn && !loginBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
}

// تسجيل الدخول عبر Google
async function signInWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/'
        }
    });
    if (error) {
        console.error('خطأ في تسجيل الدخول:', error.message);
        alert('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
    }
}

// مراقبة حالة تسجيل الدخول باستمرار
function setupAuthListener() {
    if (authListenerInitialized) return;
    authListenerInitialized = true;

    supabaseClient.auth.onAuthStateChange((event, session) => {
        updateAuthUI(session);
    });

    // تحقق فورًا عند تحميل الصفحة إذا كان هناك جلسة فعالة
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        updateAuthUI(session);
    });
}

// تحديث الواجهة حسب حالة تسجيل الدخول
function updateAuthUI(session) {
    currentSession = session;
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const dropdown = document.getElementById('userDropdown');
    
    if (!loginBtn) {
        console.warn("NOXTARY Auth UI: Element #loginBtn not found on this page.");
        return;
    }

    if (session && session.user) {
        localStorage.setItem('noxtary_has_logged_in', 'true');
        if (window.location.pathname.endsWith('/welcome.html')) {
            window.location.replace('/');
            return;
        }
        const user = session.user;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
        const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

        if (avatarUrl) {
            loginBtn.innerHTML = `
                <img src="${avatarUrl}" alt="${name}"
                     style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(100,181,246,0.6);flex-shrink:0;"
                     onerror="this.style.display='none'; this.nextSibling.style.display='flex';"/>
                <span style="display:none;width:26px;height:26px;border-radius:50%;background:var(--blue-glow);color:#fff;font-size:0.7rem;font-weight:700;align-items:center;justify-content:center;flex-shrink:0;">${initials}</span>`;
        } else {
            loginBtn.innerHTML = `
                <span style="display:inline-flex;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--blue-glow),var(--blue-bright));color:#fff;font-size:0.7rem;font-weight:700;align-items:center;justify-content:center;flex-shrink:0;">${initials}</span>`;
        }
        loginBtn.title = name;
        if (loginModal) loginModal.classList.remove('active');
        if (dropdown) dropdown.classList.remove('show');
    } else {
        loginBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
            <span data-i18n="login">Login</span>`;
        loginBtn.title = '';
        if (dropdown) dropdown.classList.remove('show');
        // Re-apply translation for login text
        const savedLang = localStorage.getItem('noxtary_lang') || 'EN';
        const loginSpan = loginBtn.querySelector('[data-i18n="login"]');
        if (loginSpan && TRANSLATIONS[savedLang]?.login) {
            loginSpan.textContent = TRANSLATIONS[savedLang].login;
        }
    }
}

// تسجيل الخروج
async function signOut() {
    await supabaseClient.auth.signOut();
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
    // 1. Setup Theme Auto-Detection (System Device Theme)
    setupSystemThemeDetection();

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
    setupAuthListener();
    setupSubscribeListeners();
    setupProModal();

    // 4. Navbar hide-on-scroll
    setupNavbarScrollBehavior();
}

function setupProModal() {
    const proBtns = document.querySelectorAll('.pro-upgrade-btn, #proUpgradeBtn, [data-action="open-pro-modal"]');
    const subModal = document.getElementById('subscriptionModal');
    const closeBtn = document.getElementById('subModalClose');

    proBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (subModal) subModal.classList.add('active');
        });
    });

    if (closeBtn && subModal) {
        closeBtn.addEventListener('click', () => {
            subModal.classList.remove('active');
        });

        subModal.addEventListener('click', (e) => {
            if (e.target === subModal) {
                subModal.classList.remove('active');
            }
        });
    }
}

function setupSubscribeListeners() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#subscribeBtn, .subscribe-btn, .pd-subscribe-btn, [data-action="subscribe"]');
        if (btn && !btn.getAttribute('onclick')) {
            const subModal = document.getElementById('subscriptionModal');
            if (subModal) {
                subModal.classList.add('active');
            } else {
                handleSubscribeClick();
            }
        }
    });
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeCore();
    initApp();
});


// ─────────────────────────────────────────────
// UX ENHANCEMENTS — Added by UI/UX Polish Pass
// ─────────────────────────────────────────────

/**
 * Smooth animated category switching:
 * fade-out + slide-down → swap content → fade-in + slide-up
 */
function renderItemsAnimated(filter = 'all', query = '') {
    const grid = document.getElementById('itemsGrid');
    if (!grid) { renderItems(filter, query); return; }

    // Fade out
    grid.classList.add('grid-switching-out');
    grid.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(12px)';
    grid.style.pointerEvents = 'none';

    setTimeout(() => {
        // Swap content
        renderItems(filter, query);

        // Prepare for fade-in
        grid.style.transition = 'none';
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(12px)';

        // Force reflow so browser registers the reset
        void grid.offsetHeight;

        // Fade in
        grid.style.transition = 'opacity 0.28s ease-out, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
        grid.style.pointerEvents = '';
        grid.classList.remove('grid-switching-out');
    }, 200);
}


/**
 * Scroll-To-Top floating button:
 * – appears after 300px of scroll
 * – smooth scroll + arrow animation on click
 */
function initScrollToTop() {
    // Only inject if on a page that has sufficient content
    if (document.getElementById('scrollTopBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.title = 'Back to top';
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"/>
        </svg>`;
    document.body.appendChild(btn);

    // Show / hide based on scroll position
    const THRESHOLD = 300;
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > THRESHOLD) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Click: animate arrow then scroll to top
    btn.addEventListener('click', () => {
        btn.classList.add('clicking');
        setTimeout(() => btn.classList.remove('clicking'), 350);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


/**
 * Horizontal drag-scroll for categories bar:
 * – Mouse drag to scroll left/right on desktop
 * – Mouse wheel scroll horizontally
 * – Prevent click trigger if user dragged
 */
function initCategoryDragScroll() {
    const container = document.querySelector('.tabs-container');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let didDrag = false;

    // Desktop mouse drag
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        didDrag = false;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.getBoundingClientRect().left;
        scrollLeft = container.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
        isDown = false;
        if (container) container.style.cursor = '';
    });

    document.addEventListener('mouseleave', () => {
        isDown = false;
        if (container) container.style.cursor = '';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.getBoundingClientRect().left;
        const walk = (x - startX) * 1.4;
        if (Math.abs(walk) > 4) didDrag = true;
        container.scrollLeft = scrollLeft - walk;
    });

    // Prevent tab button click when releasing a drag
    container.addEventListener('click', (e) => {
        if (didDrag) {
            e.stopPropagation();
            didDrag = false;
        }
    }, true);

    // Mouse wheel horizontal scroll
    container.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            container.scrollLeft += e.deltaY * 0.85;
        }
    }, { passive: false });
}