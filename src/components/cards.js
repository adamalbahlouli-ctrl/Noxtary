/* =====================================================
   CARDS COMPONENT - cards.js
   ===================================================== */
import { getTypeConfig, TAB_GROUPS } from '../config.js';
import { getTranslation } from '../services/translate.js';
import { openLightbox } from './lightbox.js';

export function viewProduct(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + productId;
}

window.viewProduct = viewProduct; // Expose to window for inline onclicks

export function shareProduct(title) {
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

window.shareProduct = shareProduct; // Expose to window for inline onclicks

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
            ${getTranslation('view', 'View')}
        </button>
    `;
    return div;
}

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

export function renderItems(productsData, filter = 'all', query = '') {
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

export function loadProductDetails(productsData) {
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
            <h3 class="pd-section-title">${getTranslation('screenshots', 'Screenshots')}</h3>
            <div class="pd-screenshots-gallery">
                ${shots.map((src, i) => `
                    <img src="${src}" alt="Screenshot ${i+1}" class="pd-screenshot"
                          loading="lazy" onclick="openLightbox(${i})"
                          onload="if(this.naturalWidth>this.naturalHeight)this.classList.add('landscape')"
                          onerror="this.style.display='none'">`
                ).join('')}
            </div>
        </div>` : '';

    let actionsHTML  = '';
    let viewerHTML    = '';

    if (product.type === 'books') {
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
