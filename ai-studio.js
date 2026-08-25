// ============================================================
// NOXTARY — ai-studio.js
// AI Studio: Prompt Builder + AI Writer
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
        if (creditsWrapper) creditsWrapper.innerHTML = '';
        showSigninGate();
        return;
    }

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
// Tab Switcher — supports all three tools
// ─────────────────────────────────────────────
function switchTab(tab) {
    // All tab buttons and panels
    const tabs = ['promptBuilder', 'aiWriter', 'imagePrompt'];

    tabs.forEach(function (t) {
        const panelId = {
            promptBuilder: 'panelPromptBuilder',
            aiWriter:      'panelAiWriter',
            imagePrompt:   'panelImagePrompt'
        }[t];
        const btnId = {
            promptBuilder: 'tabPromptBuilder',
            aiWriter:      'tabAiWriter',
            imagePrompt:   'tabImagePrompt'
        }[t];

        const panel = document.getElementById(panelId);
        const btn   = document.getElementById(btnId);

        if (t === tab) {
            if (panel) panel.style.display = 'block';
            if (btn)   btn.classList.add('active');
        } else {
            if (panel) panel.style.display = 'none';
            if (btn)   btn.classList.remove('active');
        }
    });
}

// ─────────────────────────────────────────────
// TOOL 1: Generate Prompt — calls Edge Function
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
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            return;
        }

        if (resultBox) {
            resultBox.textContent = data.result;
            resultBox.style.display = 'block';
        }
        if (copyRow) copyRow.style.display = 'block';

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
// TOOL 2: Generate Writing — calls Edge Function
// ─────────────────────────────────────────────
async function generateWriting() {
    const input       = document.getElementById('writerInput').value.trim();
    const contentType = document.getElementById('writerContentType').value;
    const tone        = document.getElementById('writerTone').value;
    const resultBox   = document.getElementById('writerResultBox');
    const copyRow     = document.getElementById('writerCopyRow');
    const btn         = document.getElementById('writerGenerateBtn');

    if (!input) {
        alert('Please describe what you want to write about.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Writing...';

    if (resultBox) resultBox.style.display = 'none';
    if (copyRow)   copyRow.style.display   = 'none';

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-writer', {
            body: { input, content_type: contentType, tone: tone }
        });

        if (error) {
            alert('Something went wrong. Please try again.');
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (data.error.includes('\u0631\u0635\u064a\u062f \u063a\u064a\u0631 \u0643\u0627\u0641\u064d')) {
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            return;
        }

        if (resultBox) {
            resultBox.textContent = data.result;
            resultBox.style.display = 'block';
        }
        if (copyRow) copyRow.style.display = 'block';

        if (typeof data.remaining_balance === 'number') {
            const display = document.getElementById('creditsDisplay');
            if (display) display.textContent = '\u26A1 ' + data.remaining_balance + ' Credits';
        }

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#9997;&#65039; Generate';
    }
}

// ─────────────────────────────────────────────
// Copy Helpers — shared clipboard logic
// ─────────────────────────────────────────────
async function _copyText(text, btnEl) {
    try {
        await navigator.clipboard.writeText(text);
        _showCopiedFeedback(btnEl);
    } catch (err) {
        // Fallback for browsers that block clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            _showCopiedFeedback(btnEl);
        } catch (e) {
            alert('Could not copy text. Please copy it manually.');
        }
        document.body.removeChild(textarea);
    }
}

function _showCopiedFeedback(btn) {
    if (!btn) return;
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '&#10003; Copied!';
    setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
    }, 2000);
}

// Prompt Builder copy
function copyResult() {
    const resultBox = document.getElementById('resultBox');
    const copyBtn   = document.getElementById('copyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}

// AI Writer copy
function copyWriterResult() {
    const resultBox = document.getElementById('writerResultBox');
    const copyBtn   = document.getElementById('writerCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}

// ─────────────────────────────────────────────
// TOOL 3: Generate Image Prompt — calls Edge Function
// ─────────────────────────────────────────────
async function generateImagePrompt() {
    const input     = document.getElementById('imagePromptInput').value.trim();
    const platform  = document.getElementById('imagePromptPlatform').value;
    const resultBox = document.getElementById('imagePromptResultBox');
    const copyRow   = document.getElementById('imagePromptCopyRow');
    const btn       = document.getElementById('imagePromptGenerateBtn');

    if (!input) {
        alert('Please describe your image idea first.');
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

    if (resultBox) resultBox.style.display = 'none';
    if (copyRow)   copyRow.style.display   = 'none';

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-image-prompt', {
            body: { input, platform }
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

        if (resultBox) {
            resultBox.textContent = data.result;
            resultBox.style.display = 'block';
        }
        if (copyRow) copyRow.style.display = 'block';

        if (typeof data.remaining_balance === 'number') {
            const display = document.getElementById('creditsDisplay');
            if (display) display.textContent = '\u26A1 ' + data.remaining_balance + ' Credits';
        }

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#127912; Generate Image Prompt';
    }
}

// Image Prompt copy
function copyImagePromptResult() {
    const resultBox = document.getElementById('imagePromptResultBox');
    const copyBtn   = document.getElementById('imagePromptCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}
