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
    initAITabsDragScroll();

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
// Plan Modal & Subscription Checkout Logic
// ─────────────────────────────────────────────
function openAIStudioPlanModal() {
    const modal = document.getElementById('aiStudioPlanModal');
    if (modal) modal.classList.add('active');
}

function closeAIStudioPlanModal() {
    const modal = document.getElementById('aiStudioPlanModal');
    if (modal) modal.classList.remove('active');
}

// User clicked the shining button -> Open the ChatGPT Pro style plan modal
function handleAIStudioSubscribeClick() {
    openAIStudioPlanModal();
}

// User clicked the checkout button inside the plan modal
async function executeAIStudioCheckout() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        alert('Please sign in first to complete your upgrade.');
        closeAIStudioPlanModal();
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    const baseCheckoutUrl = 'https://noxtary.lemonsqueezy.com/checkout/buy/dcc92a7a-7920-4d49-874d-dea737c737ac';
    const checkoutUrl = `${baseCheckoutUrl}?checkout[email]=${encodeURIComponent(session.user.email)}&checkout[custom][user_id]=${session.user.id}`;

    window.location.href = checkoutUrl;
}

// ─────────────────────────────────────────────
// Handle auth state — show gate or tool UI
// ─────────────────────────────────────────────
async function handleAuthState(session) {
    const creditsWrapper = document.getElementById('creditsWrapper');

    if (!session) {
        if (creditsWrapper) {
            creditsWrapper.innerHTML = `
                <button class="ai-unlimited-btn" id="aiStudioSubscribeBtn" onclick="openAIStudioPlanModal()" type="button">
                    &#10024; Unlimited Access
                </button>`;
        }
        showSigninGate();
        return;
    }

    showToolUI();
    await loadCredits(session, creditsWrapper);
}

// ─────────────────────────────────────────────
// Load & display credits balance / subscription
// ─────────────────────────────────────────────
async function loadCredits(session, creditsWrapper) {
    try {
        // 1. Check for active unlimited subscription
        const { data: subData } = await supabaseClient
            .from('subscriptions')
            .select('status, expires_at')
            .eq('user_id', session.user.id)
            .eq('product_group', 'ai-studio-unlimited')
            .eq('status', 'active')
            .maybeSingle();

        const isUnlimited = subData && (!subData.expires_at || new Date(subData.expires_at) > new Date());

        if (isUnlimited) {
            if (creditsWrapper) {
                creditsWrapper.innerHTML = `
                    <span class="credits-card credits-card--unlimited" id="creditsDisplay">
                        &#8734; Unlimited Access
                    </span>`;
            }
            return;
        }

        // 2. Normal user: load balance & show shining unlimited button
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
                </span>
                <button class="ai-unlimited-btn" id="aiStudioSubscribeBtn" onclick="handleAIStudioSubscribeClick()" type="button">
                    &#10024; Unlimited Access
                </button>`;
        }
    } catch (err) {
        console.error('AI Studio: Could not load credits/subscription', err);
        if (creditsWrapper) {
            creditsWrapper.innerHTML = `
                <span class="credits-card" id="creditsDisplay">&#9889; — Credits</span>
                <button class="ai-unlimited-btn" id="aiStudioSubscribeBtn" onclick="handleAIStudioSubscribeClick()" type="button">
                    &#10024; Unlimited Access
                </button>`;
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
// Tab Switcher — supports all five tools
// ─────────────────────────────────────────────
function switchTab(tab) {
    const tabs = ['promptBuilder', 'aiWriter', 'imagePrompt', 'fileAnalyzer', 'aiChat'];

    // aiChat panel uses flex layout; all others use block
    const displayType = {
        promptBuilder: 'block',
        aiWriter:      'block',
        imagePrompt:   'block',
        fileAnalyzer:  'block',
        aiChat:        'flex'
    };

    tabs.forEach(function (t) {
        const panelId = {
            promptBuilder: 'panelPromptBuilder',
            aiWriter:      'panelAiWriter',
            imagePrompt:   'panelImagePrompt',
            fileAnalyzer:  'panelFileAnalyzer',
            aiChat:        'panelAiChat'
        }[t];
        const btnId = {
            promptBuilder: 'tabPromptBuilder',
            aiWriter:      'tabAiWriter',
            imagePrompt:   'tabImagePrompt',
            fileAnalyzer:  'tabFileAnalyzer',
            aiChat:        'tabAiChat'
        }[t];

        const panel = document.getElementById(panelId);
        const btn   = document.getElementById(btnId);

        if (t === tab) {
            if (panel) panel.style.display = displayType[t];
            if (btn) {
                btn.classList.add('active');
                // Center the active tab in the scrollable tabs bar
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        } else {
            if (panel) panel.style.display = 'none';
            if (btn)   btn.classList.remove('active');
        }
    });
}

/**
 * Horizontal drag-scroll for AI Studio tabs bar:
 * – Mouse drag to scroll left/right on desktop
 * – Mouse wheel scroll horizontally
 * – Prevent tab button click when releasing a drag
 */
function initAITabsDragScroll() {
    const container = document.querySelector('.ai-tabs');
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
        if (container) container.style.cursor = 'grab';
    });

    document.addEventListener('mouseleave', () => {
        isDown = false;
        if (container) container.style.cursor = 'grab';
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

        if (data.unlimited) {
            const display = document.getElementById('creditsDisplay');
            if (display) {
                display.textContent = '\u221E Unlimited Access';
                display.classList.add('credits-card--unlimited');
            }
            const subBtn = document.getElementById('aiStudioSubscribeBtn');
            if (subBtn) subBtn.remove();
        } else if (typeof data.remaining_balance === 'number') {
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

        if (data.unlimited) {
            const display = document.getElementById('creditsDisplay');
            if (display) {
                display.textContent = '\u221E Unlimited Access';
                display.classList.add('credits-card--unlimited');
            }
            const subBtn = document.getElementById('aiStudioSubscribeBtn');
            if (subBtn) subBtn.remove();
        } else if (typeof data.remaining_balance === 'number') {
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

        if (data.unlimited) {
            const display = document.getElementById('creditsDisplay');
            if (display) {
                display.textContent = '\u221E Unlimited Access';
                display.classList.add('credits-card--unlimited');
            }
            const subBtn = document.getElementById('aiStudioSubscribeBtn');
            if (subBtn) subBtn.remove();
        } else if (typeof data.remaining_balance === 'number') {
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

// ─────────────────────────────────────────────
// TOOL 4: File Analyzer — helpers & main function
// ─────────────────────────────────────────────

// Called by onchange on the hidden file input — updates the filename display
function onFileChosen(input) {
    const nameEl = document.getElementById('fileAnalyzerFileName');
    if (!nameEl) return;

    if (input.files && input.files[0]) {
        const file = input.files[0];
        // Show warning immediately if file is too large
        if (file.size > 8 * 1024 * 1024) {
            nameEl.textContent = '\u26A0\uFE0F File too large — max 8 MB';
            nameEl.style.color = '#f87171';
            input.value = ''; // clear the selection
        } else {
            nameEl.textContent = file.name;
            nameEl.style.color = '';
        }
    } else {
        nameEl.textContent = 'No file chosen';
        nameEl.style.color = '';
    }
}

// Converts a File object to a base64 string (without the data:mime/type;base64, prefix)
function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            // Strip the "data:mime/type;base64," prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Main analysis function — base64 conversion happens here, not on file selection
async function analyzeFile() {
    const fileInput = document.getElementById('fileAnalyzerInput');
    const question  = document.getElementById('fileAnalyzerQuestion').value.trim();
    const resultBox = document.getElementById('fileAnalyzerResultBox');
    const copyRow   = document.getElementById('fileAnalyzerCopyRow');
    const btn       = document.getElementById('fileAnalyzerAnalyzeBtn');

    const file = fileInput.files[0];
    if (!file) {
        alert('Please choose a file first.');
        return;
    }

    if (file.size > 8 * 1024 * 1024) {
        alert('File too large. Max 8MB.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Analyzing...';

    if (resultBox) resultBox.style.display = 'none';
    if (copyRow)   copyRow.style.display   = 'none';

    try {
        // Convert to base64 only at analysis time
        const base64Data = await fileToBase64(file);
        const mimeType   = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain');

        const { data, error } = await supabaseClient.functions.invoke('ai-file-analyzer', {
            body: { file_base64: base64Data, mime_type: mimeType, question: question }
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

        if (data.unlimited) {
            const display = document.getElementById('creditsDisplay');
            if (display) {
                display.textContent = '\u221E Unlimited Access';
                display.classList.add('credits-card--unlimited');
            }
            const subBtn = document.getElementById('aiStudioSubscribeBtn');
            if (subBtn) subBtn.remove();
        } else if (typeof data.remaining_balance === 'number') {
            const display = document.getElementById('creditsDisplay');
            if (display) display.textContent = '\u26A1 ' + data.remaining_balance + ' Credits';
        }

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#128196; Analyze';
    }
}

// File Analyzer copy
function copyFileAnalyzerResult() {
    const resultBox = document.getElementById('fileAnalyzerResultBox');
    const copyBtn   = document.getElementById('fileAnalyzerCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}

// ─────────────────────────────────────────────
// TOOL 5: AI Chat — stateful conversation
// ─────────────────────────────────────────────

// In-memory conversation history — reset on "New Chat"
let chatMessages = []; // { role: 'user'|'model', text: string }

// Appends a bubble to the messages container and scrolls to bottom
function appendChatBubble(role, text) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return null;

    // Remove empty-state hint on first real bubble
    const hint = document.getElementById('chatEmptyHint');
    if (hint) hint.remove();

    const bubble = document.createElement('div');
    bubble.className = role === 'user' ? 'chat-bubble chat-bubble--user' : 'chat-bubble chat-bubble--ai';
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

// Sends the typed message to the Edge Function and appends the AI reply
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    // Lock input while waiting
    input.value = '';
    input.disabled = true;
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    // Show user bubble immediately
    chatMessages.push({ role: 'user', text });
    appendChatBubble('user', text);

    // Show typing indicator in an AI bubble
    const typingBubble = appendChatBubble('model', '⏳ ...');

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-chat', {
            body: { messages: chatMessages }
        });

        if (error) {
            if (typingBubble) typingBubble.textContent = 'Something went wrong. Please try again.';
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (data.error.includes('\u0631\u0635\u064a\u062f \u063a\u064a\u0631 \u0643\u0627\u0641\u064d')) {
                if (typingBubble) typingBubble.textContent = '\u26A0\uFE0F Not enough credits.';
            } else if (data.error.includes('too long')) {
                if (typingBubble) typingBubble.textContent = '\u26A0\uFE0F Conversation too long. Please start a new chat.';
            } else {
                if (typingBubble) typingBubble.textContent = '\u26A0\uFE0F ' + data.error;
            }
            return;
        }

        // Replace typing indicator with real reply
        if (typingBubble) typingBubble.textContent = data.result;
        chatMessages.push({ role: 'model', text: data.result });

        // Update shared credits display
        if (data.unlimited) {
            const display = document.getElementById('creditsDisplay');
            if (display) {
                display.textContent = '\u221E Unlimited Access';
                display.classList.add('credits-card--unlimited');
            }
            const subBtn = document.getElementById('aiStudioSubscribeBtn');
            if (subBtn) subBtn.remove();
        } else if (typeof data.remaining_balance === 'number') {
            const display = document.getElementById('creditsDisplay');
            if (display) display.textContent = '\u26A1 ' + data.remaining_balance + ' Credits';
        }

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        if (typingBubble) typingBubble.textContent = 'Something went wrong. Please try again.';
    } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

// Clears the conversation and resets state
function startNewChat() {
    chatMessages = [];
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = '';
        // Restore empty-state hint
        const hint = document.createElement('div');
        hint.className = 'chat-empty-hint';
        hint.id = 'chatEmptyHint';
        hint.innerHTML = '<span>💬</span>Send a message to start chatting with AI';
        container.appendChild(hint);
    }
    const input = document.getElementById('chatInput');
    if (input) { input.value = ''; input.focus(); }
}

// Wire up Chat event listeners after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatInput   = document.getElementById('chatInput');
    const chatNewBtn  = document.getElementById('chatNewBtn');

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    if (chatNewBtn) {
        chatNewBtn.addEventListener('click', startNewChat);
    }

    // Plan Modal outside click & Escape close
    const planModal = document.getElementById('aiStudioPlanModal');
    if (planModal) {
        planModal.addEventListener('click', function(e) {
            if (e.target === planModal) {
                closeAIStudioPlanModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAIStudioPlanModal();
        }
    });
});
