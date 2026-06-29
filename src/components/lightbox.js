/* =====================================================
   LIGHTBOX COMPONENT - lightbox.js
   ===================================================== */

export function openLightbox(index) {
    window._lbIndex = index;
    renderLightbox();
    document.getElementById('lbOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
    const o = document.getElementById('lbOverlay');
    if (o) o.classList.remove('active');
    document.body.style.overflow = '';
}

export function shiftLightbox(dir) {
    const total = window._lbScreenshots.length;
    window._lbIndex = (window._lbIndex + dir + total) % total;
    renderLightbox();
}

function renderLightbox() {
    const img = document.getElementById('lbImg');
    const ctr = document.getElementById('lbCounter');
    if (img) img.src = window._lbScreenshots[window._lbIndex];
    if (ctr) ctr.textContent = (window._lbIndex + 1) + ' / ' + window._lbScreenshots.length;
}

// Global key listeners for convenience
document.addEventListener('keydown', e => {
    const o = document.getElementById('lbOverlay');
    if (!o || !o.classList.contains('active')) return;
    if (e.key === 'ArrowRight') shiftLightbox(1);
    if (e.key === 'ArrowLeft')  shiftLightbox(-1);
    if (e.key === 'Escape')     closeLightbox();
});

// Expose to window for inline HTML onclick calls
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.shiftLightbox = shiftLightbox;
