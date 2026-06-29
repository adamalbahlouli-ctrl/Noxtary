// ============================================================
// NOXTARY — config.js
// إعدادات المشروع + Supabase + TYPE_CONFIG
// ============================================================

// ─────────────────────────────────────────────
// Supabase Config
// ─────────────────────────────────────────────
const SUPABASE_URL   = 'https://sbwfrigdhivipmmkzgag.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2ZyaWdkaGl2aXBtbWt6Z2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzEzNzIsImV4cCI6MjA5NDg0NzM3Mn0.tKhZOKyOjBZkyh6lJ22A77xd2TPjns3vtNaM1W5pPO8';
const SUPABASE_TABLE = 'apps';

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

// ─────────────────────────────────────────────
// TRANSLATIONS
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

// ─────────────────────────────────────────────
// THEME CANVAS COLORS
// ─────────────────────────────────────────────
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
