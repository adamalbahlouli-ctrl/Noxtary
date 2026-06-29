/* =====================================================
   TRANSLATION SERVICE - translate.js
   ===================================================== */

export const TRANSLATIONS = {
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

export function getTranslation(key, defaultVal) {
    const currentLang = localStorage.getItem('noxtary_lang') || 'EN';
    return TRANSLATIONS[currentLang]?.[key] || defaultVal || key;
}

export function applyTranslations(lang) {
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
