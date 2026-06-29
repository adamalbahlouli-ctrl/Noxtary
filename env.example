// ============================================================
// NOXTARY — home.js
// منطق الصفحة الرئيسية
// ============================================================

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
