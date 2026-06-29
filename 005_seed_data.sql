// ============================================================
// NOXTARY — auth.js
// تسجيل الدخول والخروج (Google مستقبلاً)
// ============================================================

function setupLoginModal() {
    const loginBtn  = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const modalClose = document.getElementById('modalClose');
    const loginForm  = document.getElementById('loginForm');

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
