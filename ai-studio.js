// ============================================================
// NOXTARY — ai-studio.js
// AI Studio: Prompt Builder tool
// Uses the same supabaseClient defined in script.js
// ============================================================

// ─────────────────────────────────────────────
// Init — runs after script.js and the DOM are ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    initAIStudio();

    // Gate button opens the login modal
    const gateBtn = document.getElementById('signinGateBtn');
    if (gateBtn) {
        gateBtn.addEventListener('click', function () {
            document.getElementById('loginModal')?.classList.add('active');
        });
    }

    // React to auth state changes (e.g. user logs in while on this page)
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.onAuthStateChange(function (event, session) {
            handleAuthState(session);
        });
    }
});

// ─────────────────────────────────────────────
// Init AI Studio — check auth & load credits
// ─────────────────────────────────────────────
async function initAIStudio() {
    if (typeof supabaseClient === 'undefined') {
        console.error('AI Studio: supabaseClient not found. Make sure script.js is loaded first.');
        showSigninGate();
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        await handleAuthState(session);
    } catch (err) {
        console.error('AI Studio: Auth check failed', err);
        showSigninGate();
    }
}

// ─────────────────────────────────────────────
// Handle auth state — show gate or tool UI
// ─────────────────────────────────────────────
async function handleAuthState(session) {
    const creditsWrapper = document.getElementById('creditsWrapper');

    if (!session) {
        // Not logged in — clear credits, show gate
        if (creditsWrapper) creditsWrapper.innerHTML = '';
        showSigninGate();
        return;
    }

    // Logged in — show tool UI then load credits
    showToolUI();
    await loadCredits(session, creditsWrapper);
}

// ─────────────────────────────────────────────
// Load & display credits balance
// ─────────────────────────────────────────────
async function loadCredits(session, creditsWrapper) {
    try {
        const { data } = await supabaseClient
            .from('ai_credits')
            .select('balance')
            .eq('user_id', session.user.id)
            .maybeSingle();

        const balance = (data && data.balance !== null && data.balance !== undefined)
            ? data.balance
            : '—';

        if (creditsWrapper) {
            creditsWrapper.innerHTML = `
                <span class="credits-card" id="creditsDisplay">
                    &#9889; ${balance} Credits
                </span>`;
        }
    } catch (err) {
        console.error('AI Studio: Could not load credits', err);
        if (creditsWrapper) {
            creditsWrapper.innerHTML = `<span class="credits-card" id="creditsDisplay">&#9889; — Credits</span>`;
        }
    }
}

// ─────────────────────────────────────────────
// Show / hide helpers
// ─────────────────────────────────────────────
function showSigninGate() {
    const gate = document.getElementById('signinGate');
    const tool = document.getElementById('toolUI');
    if (gate) gate.style.display = 'block';
    if (tool) tool.style.display = 'none';
}

function showToolUI() {
    const gate = document.getElementById('signinGate');
    const tool = document.getElementById('toolUI');
    if (gate) gate.style.display = 'none';
    if (tool) tool.style.display = 'block';
}

// ─────────────────────────────────────────────
// Generate Prompt — calls Supabase Edge Function
// ─────────────────────────────────────────────
async function generatePrompt() {
    const input     = document.getElementById('promptInput').value.trim();
    const resultBox = document.getElementById('resultBox');
    const copyRow   = document.getElementById('copyRow');
    const btn       = document.getElementById('generateBtn');

    if (!input) {
        alert('Please describe your idea first.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Generating...';

    // Hide previous result and copy button
    if (resultBox) resultBox.style.display = 'none';
    if (copyRow)   copyRow.style.display   = 'none';

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-prompt-builder', {
            body: { input }
        });

        if (error) {
            alert('Something went wrong. Please try again.');
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (data.error.includes('\u0631\u0635\u064a\u062f \u063a\u064a\u0631 \u0643\u0627\u0641\u064d')) {
                // 'رصيد غير كافٍ'
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            return;
        }

        // Show the real Gemini result
        if (resultBox) {
            resultBox.textContent = data.result;
            resultBox.style.display = 'block';
        }

        // Show Copy button
        if (copyRow) copyRow.style.display = 'block';

        // Update credits display
        if (typeof data.remaining_balance === 'number') {
            const display = document.getElementById('creditsDisplay');
            if (display) display.textContent = '\u26A1 ' + data.remaining_balance + ' Credits';
        }

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#10024; Generate Prompt';
    }
}

// ─────────────────────────────────────────────
// Copy Result to Clipboard
// ─────────────────────────────────────────────
async function copyResult() {
    const resultBox = document.getElementById('resultBox');
    const copyBtn   = document.getElementById('copyBtn');

    if (!resultBox || !resultBox.textContent.trim()) return;

    try {
        await navigator.clipboard.writeText(resultBox.textContent);

        // Visual feedback: "✔ Copied!"
        if (copyBtn) {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '&#10003; Copied!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '&#128203; Copy';
            }, 2000);
        }
    } catch (err) {
        // Fallback for browsers that block clipboard API
        console.warn('Clipboard API failed, using execCommand fallback', err);
        const textarea = document.createElement('textarea');
        textarea.value = resultBox.textContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity  = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '&#10003; Copied!';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '&#128203; Copy';
                }, 2000);
            }
        } catch (e) {
            alert('Could not copy text. Please copy it manually.');
        }
        document.body.removeChild(textarea);
    }
}
