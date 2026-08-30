// ============================================================
// NOXTARY — ai-studio.js (Executive AI Creative Workstation)
// ============================================================

// ─────────────────────────────────────────────
// Init — runs after script.js and the DOM are ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    initAIStudio();
    initAITabsDragScroll();
    initFileDropzone();

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

    // Wire up Chat input auto-expand and listeners
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatInput   = document.getElementById('chatInput');
    const chatNewBtn  = document.getElementById('chatNewBtn');

    if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 130) + 'px';
        });
    }
    if (chatNewBtn) chatNewBtn.addEventListener('click', startNewChat);

    // Plan Modal outside click & Escape close
    const planModal = document.getElementById('aiStudioPlanModal');
    if (planModal) {
        planModal.addEventListener('click', function(e) {
            if (e.target === planModal) closeAIStudioPlanModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAIStudioPlanModal();
    });
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
// 25% Probability Modal Auto-Trigger
// ─────────────────────────────────────────────
function evaluateRandomModalTrigger(isUnlimited) {
    if (isUnlimited) return; // Never show if user already purchased unlimited pass
    if (sessionStorage.getItem('noxtary_ai_modal_shown')) return; // Trigger at most once per session

    // 25% chance of showing modal upon entering the AI Studio page
    const shouldShow = Math.random() < 0.25;
    if (shouldShow) {
        sessionStorage.setItem('noxtary_ai_modal_shown', 'true');
        setTimeout(() => {
            openAIStudioPlanModal();
        }, 1200);
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

function handleAIStudioSubscribeClick() {
    openAIStudioPlanModal();
}

async function executeAIStudioCheckout() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        alert('Please sign in first to complete your upgrade.');
        closeAIStudioPlanModal();
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    const baseCheckoutUrl = 'https://noxtary.lemonsqueezy.com/checkout/buy/88486892-f36a-42af-a9ee-40a74c941248';
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
                <button class="ai-pro-pass-btn" onclick="openAIStudioPlanModal()" type="button">
                    👑 Unlimited ($15)
                </button>`;
        }
        showSigninGate();
        evaluateRandomModalTrigger(false);
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
                        👑 Unlimited Lifetime Pass
                    </span>`;
            }
            return;
        }

        // 25% Probability auto-modal check for non-subscribed users
        evaluateRandomModalTrigger(false);

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
                    ⚡ ${balance} Credits
                </span>
                <button class="ai-pro-pass-btn" onclick="handleAIStudioSubscribeClick()" type="button">
                    👑 Unlimited ($15)
                </button>`;
        }
    } catch (err) {
        console.error('AI Studio: Could not load credits/subscription', err);
        if (creditsWrapper) {
            creditsWrapper.innerHTML = `
                <span class="credits-card" id="creditsDisplay">⚡ — Credits</span>
                <button class="ai-pro-pass-btn" onclick="handleAIStudioSubscribeClick()" type="button">
                    👑 Unlimited ($15)
                </button>`;
        }
    }
}

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
// Tab Switcher — supports all nine tools
// ─────────────────────────────────────────────
function switchTab(tab) {
    const tabs = ['aiChat', 'promptBuilder', 'aiWriter', 'imagePrompt', 'fileAnalyzer', 'nameGenerator', 'codeAssistant', 'bookWriter', 'historyFavs'];

    const displayType = {
        aiChat:        'flex',
        promptBuilder: 'block',
        aiWriter:      'block',
        imagePrompt:   'block',
        fileAnalyzer:  'block',
        nameGenerator: 'block',
        codeAssistant: 'block',
        bookWriter:    'block',
        historyFavs:   'block'
    };

    tabs.forEach(function (t) {
        const panelId = {
            aiChat:        'panelAiChat',
            promptBuilder: 'panelPromptBuilder',
            aiWriter:      'panelAiWriter',
            imagePrompt:   'panelImagePrompt',
            fileAnalyzer:  'panelFileAnalyzer',
            nameGenerator: 'panelNameGenerator',
            codeAssistant: 'panelCodeAssistant',
            bookWriter:    'panelBookWriter',
            historyFavs:   'panelHistoryFavs'
        }[t];
        const btnId = {
            aiChat:        'tabAiChat',
            promptBuilder: 'tabPromptBuilder',
            aiWriter:      'tabAiWriter',
            imagePrompt:   'tabImagePrompt',
            fileAnalyzer:  'tabFileAnalyzer',
            nameGenerator: 'tabNameGenerator',
            codeAssistant: 'tabCodeAssistant',
            bookWriter:    'tabBookWriter',
            historyFavs:   'tabHistoryFavs'
        }[t];

        const panel = document.getElementById(panelId);
        const btn   = document.getElementById(btnId);

        if (t === tab) {
            if (panel) {
                panel.style.display = displayType[t];
                if (t === 'aiChat') panel.style.flexDirection = 'column';
            }
            if (btn) btn.classList.add('active');
        } else {
            if (panel) panel.style.display = 'none';
            if (btn)   btn.classList.remove('active');
        }
    });

    const tabsContainer = document.querySelector('.ai-tabs');
    const activeBtn = document.getElementById({
        aiChat:        'tabAiChat',
        promptBuilder: 'tabPromptBuilder',
        aiWriter:      'tabAiWriter',
        imagePrompt:   'tabImagePrompt',
        fileAnalyzer:  'tabFileAnalyzer',
        nameGenerator: 'tabNameGenerator',
        codeAssistant: 'tabCodeAssistant',
        bookWriter:    'tabBookWriter',
        historyFavs:   'tabHistoryFavs'
    }[tab]);

    if (tabsContainer && activeBtn) {
        const scrollOffset = activeBtn.offsetLeft - (tabsContainer.clientWidth / 2) + (activeBtn.clientWidth / 2);
        tabsContainer.scrollTo({ left: Math.max(0, scrollOffset), behavior: 'smooth' });
    }

    if (tab === 'bookWriter' && typeof loadBookProjects === 'function') {
        loadBookProjects();
    }
    if (tab === 'historyFavs') {
        if (typeof loadHistory === 'function') loadHistory();
        if (typeof loadFavorites === 'function') loadFavorites();
    }
}

function initAITabsDragScroll() {
    const container = document.querySelector('.ai-tabs');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let didDrag = false;

    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDown = true;
        didDrag = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        setTimeout(() => { didDrag = false; }, 60);
    });

    document.addEventListener('mouseleave', () => {
        isDown = false;
        didDrag = false;
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 6) {
            didDrag = true;
            container.scrollLeft = scrollLeft - walk;
        }
    });

    container.addEventListener('click', (e) => {
        if (didDrag) {
            e.preventDefault();
            e.stopPropagation();
            didDrag = false;
        }
    }, true);
}

// ─────────────────────────────────────────────
// TOOL 1: 💬 AI Chat — stateful conversation
// ─────────────────────────────────────────────
let chatMessages = []; // { role: 'user'|'model', text: string }

function parseMarkdownToHtml(markdown) {
    if (!markdown) return '';
    let escaped = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    escaped = escaped.replace(/```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        const langName = lang ? lang.toUpperCase() : 'CODE';
        const rawCodeAttr = encodeURIComponent(code);
        return `
        <div class="ai-code-block">
            <div class="ai-code-header">
                <span>${langName}</span>
                <button class="ai-code-copy" onclick="copyCodeFromBlock(this, '${rawCodeAttr}')">
                    📋 Copy
                </button>
            </div>
            <pre class="ai-code-content"><code>${code.trim()}</code></pre>
        </div>`;
    });

    // Inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-family:var(--font-mono); font-size:0.85em;">$1</code>');

    // Bold & Italics
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headers & Lists
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="color:#38bdf8; margin:8px 0 4px; font-family:var(--font-title,\'Orbitron\'); font-size:0.92em;">$1</h4>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h3 style="color:#38bdf8; margin:10px 0 6px; font-family:var(--font-title,\'Orbitron\'); font-size:1.02em;">$1</h3>');
    escaped = escaped.replace(/^\- (.*$)/gim, '<li style="margin-left:16px; list-style-type:disc;">$1</li>');

    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
}

function copyCodeFromBlock(btn, encodedCode) {
    const raw = decodeURIComponent(encodedCode);
    _copyText(raw, btn);
}

function appendChatBubble(role, content, isHtml = false) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return null;

    const hint = document.getElementById('chatEmptyHint');
    if (hint) hint.remove();

    const row = document.createElement('div');
    row.className = role === 'user' ? 'chat-bubble-row user' : 'chat-bubble-row ai';

    const avatar = document.createElement('div');
    avatar.className = role === 'user' ? 'chat-avatar user-avatar' : 'chat-avatar ai-avatar';
    avatar.innerHTML = role === 'user' ? '👤' : '⚡';

    const bubble = document.createElement('div');
    bubble.className = role === 'user' ? 'chat-bubble chat-bubble--user' : 'chat-bubble chat-bubble--ai';

    if (isHtml) {
        bubble.innerHTML = content;
    } else {
        bubble.innerHTML = parseMarkdownToHtml(content);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

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

    input.value = '';
    input.style.height = 'auto';
    input.disabled = true;
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    chatMessages.push({ role: 'user', text });
    appendChatBubble('user', text);

    const typingBubble = appendChatBubble('model', `
        <div class="chat-typing-indicator" aria-label="Thinking...">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `, true);

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-chat', {
            body: { messages: chatMessages }
        });

        if (error) {
            if (typingBubble) {
                typingBubble.innerHTML = '⚠️ Something went wrong. Please try again.';
            }
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (typingBubble) {
                if (data.error.includes('رصيد غير كافٍ')) {
                    typingBubble.innerHTML = '⚠️ Not enough credits remaining. Please upgrade.';
                } else {
                    typingBubble.innerHTML = '⚠️ ' + data.error;
                }
            }
            return;
        }

        if (typingBubble) {
            typingBubble.innerHTML = parseMarkdownToHtml(data.result);
        }
        chatMessages.push({ role: 'model', text: data.result });

        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        if (typingBubble) {
            typingBubble.innerHTML = '⚠️ Something went wrong. Please try again.';
        }
    } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

function sendChatStarter(starterPrompt) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = starterPrompt;
        sendChatMessage();
    }
}

function startNewChat() {
    chatMessages = [];
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = `
            <div class="chat-empty-state" id="chatEmptyHint">
                <div class="chat-empty-icon">🤖</div>
                <h3 class="chat-empty-title">Memory Reset</h3>
                <p class="chat-empty-subtitle">Direct conversational intelligence powered by Gemini AI. Pick a starter or ask anything.</p>
                <div class="chat-starter-grid">
                    <div class="chat-starter-card" onclick="sendChatStarter('Explain how asynchronous event loops work in Python with clean examples.')">
                        <strong>💻 Python Asynchronous Core</strong>
                        <span>Learn async architecture, tasks, and concurrency.</span>
                    </div>
                    <div class="chat-starter-card" onclick="sendChatStarter('Analyze the business model of modern AI SaaS platforms with revenue mechanics.')">
                        <strong>🔍 AI Business Model Deep-Dive</strong>
                        <span>Explore pricing, unit economics, and growth moats.</span>
                    </div>
                    <div class="chat-starter-card" onclick="sendChatStarter('Write a dark sci-fi cyberpunk narrative about an AI waking up in 2099.')">
                        <strong>✍️ Sci-Fi Creative Fiction</strong>
                        <span>Generate immersive worldbuilding & dialogue.</span>
                    </div>
                    <div class="chat-starter-card" onclick="sendChatStarter('Help me design a high-conversion landing page structure for a digital store.')">
                        <strong>🎨 UI/UX Conversion Strategy</strong>
                        <span>Craft wireframes, call-to-actions, and visual hierarchy.</span>
                    </div>
                </div>
            </div>`;
    }
    const input = document.getElementById('chatInput');
    if (input) { input.value = ''; input.focus(); }
}

// ─────────────────────────────────────────────
// TOOL 2: ✨ Prompt Builder (Prompt Synthesizer)
// ─────────────────────────────────────────────
function onPromptInputChanged() {
    const input = document.getElementById('promptInput')?.value || '';
    const charCountEl = document.getElementById('promptCharCount');
    if (charCountEl) charCountEl.textContent = input.length + ' chars';

    let score = 15;
    if (input.length > 20) score += 20;
    if (input.length > 80) score += 25;
    if (input.length > 150) score += 15;

    const keywords = ['lighting', 'cinematic', 'photorealistic', '8k', 'unreal', 'lens', 'volumetric', 'render', 'octane', 'fog', 'texture', 'detailed'];
    keywords.forEach(kw => {
        if (input.toLowerCase().includes(kw)) score += 4;
    });

    score = Math.min(100, Math.max(10, score));

    const powerBar = document.getElementById('promptPowerBar');
    const powerText = document.getElementById('promptPowerText');

    if (powerBar) powerBar.style.width = score + '%';
    if (powerText) {
        if (score < 35) powerText.textContent = `Weak (${score}%)`;
        else if (score < 65) powerText.textContent = `Good Quality (${score}%)`;
        else if (score < 85) powerText.textContent = `High Precision (${score}%)`;
        else powerText.textContent = `Masterpiece Engine (${score}%)`;
    }
}

function appendPromptModifier(modifierText) {
    const textarea = document.getElementById('promptInput');
    if (!textarea) return;
    const current = textarea.value.trim();
    if (!current) {
        textarea.value = modifierText;
    } else {
        textarea.value = current + ', ' + modifierText;
    }
    onPromptInputChanged();
    textarea.focus();
}

async function generatePrompt() {
    const input     = document.getElementById('promptInput').value.trim();
    const resultBox = document.getElementById('resultBox');
    const copyRow   = document.getElementById('copyRow');
    const btn       = document.getElementById('generateBtn');
    const statsEl   = document.getElementById('promptOutputStats');

    if (!input) {
        alert('Please enter your idea or concept first.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Synthesizing...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

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
            alert(data.error);
            return;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = parseMarkdownToHtml(data.result);
            if (statsEl) {
                const words = data.result.split(/\s+/).length;
                statsEl.textContent = `${words} words • ~${Math.round(words * 1.3)} tokens`;
            }
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#10024; Synthesize Master Prompt';
    }
}

function transferPromptToImage() {
    const resultBox = document.getElementById('resultBox');
    if (!resultBox) return;
    const text = resultBox.textContent.trim();
    if (!text) return;

    switchTab('imagePrompt');
    const imgInput = document.getElementById('imagePromptInput');
    if (imgInput) {
        imgInput.value = text;
        onImagePromptInputChanged();
    }
}

function copyResult() {
    const resultBox = document.getElementById('resultBox');
    const copyBtn   = document.getElementById('copyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}

// ─────────────────────────────────────────────
// TOOL 3: ✍️ AI Writer (Literature & Copy Engine)
// ─────────────────────────────────────────────
function onWriterInputChanged() {
    const input = document.getElementById('writerInput')?.value || '';
    const charCountEl = document.getElementById('writerCharCount');
    if (charCountEl) charCountEl.textContent = input.length + ' chars';
}

function selectWriterType(typeVal) {
    const chips = document.querySelectorAll('#writerTypeChips .ai-chip-pill');
    chips.forEach(c => {
        if (c.getAttribute('data-value') === typeVal) c.classList.add('active');
        else c.classList.remove('active');
    });
    const select = document.getElementById('writerContentType');
    if (select) select.value = typeVal;
}

function selectWriterTone(toneVal) {
    const chips = document.querySelectorAll('#writerToneChips .ai-chip-pill');
    chips.forEach(c => {
        if (c.getAttribute('data-value') === toneVal) c.classList.add('active');
        else c.classList.remove('active');
    });
    const select = document.getElementById('writerTone');
    if (select) select.value = toneVal;
}

async function generateWriting() {
    const input       = document.getElementById('writerInput').value.trim();
    const contentType = document.getElementById('writerContentType').value;
    const tone        = document.getElementById('writerTone').value;
    const resultBox   = document.getElementById('writerResultBox');
    const copyRow     = document.getElementById('writerCopyRow');
    const btn         = document.getElementById('writerGenerateBtn');
    const statsEl     = document.getElementById('writerStats');

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
    btn.innerHTML = '&#9203; Writing Copy...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

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
            alert(data.error);
            return;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = parseMarkdownToHtml(data.result);
            if (statsEl) {
                const words = data.result.split(/\s+/).length;
                const readMin = Math.ceil(words / 200);
                statsEl.textContent = `${words} words • ~${readMin} min read`;
            }
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#9997;&#65039; Generate Creative Copy';
    }
}

function copyWriterResult() {
    const resultBox = document.getElementById('writerResultBox');
    const copyBtn   = document.getElementById('writerCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent, copyBtn);
}

function downloadWriterMarkdown() {
    const resultBox = document.getElementById('writerResultBox');
    if (!resultBox || !resultBox.textContent.trim()) return;
    const text = resultBox.textContent.trim();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noxtary-ai-writer-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// TOOL 4: 🎨 Image Prompt (Visual AI Engineering)
// ─────────────────────────────────────────────
let selectedAspectFlag = '--ar 16:9';

function onImagePromptInputChanged() {
    const input = document.getElementById('imagePromptInput')?.value || '';
    const charCountEl = document.getElementById('imagePromptCharCount');
    if (charCountEl) charCountEl.textContent = input.length + ' chars';
}

function selectImageEngine(engineVal) {
    const chips = document.querySelectorAll('#imageEngineChips .ai-chip-pill');
    chips.forEach(c => {
        if (c.getAttribute('data-value') === engineVal) c.classList.add('active');
        else c.classList.remove('active');
    });
    const select = document.getElementById('imagePromptPlatform');
    if (select) select.value = engineVal;
    updateImageStats();
}

function selectAspectRatio(cardEl, arFlag) {
    document.querySelectorAll('.ai-aspect-card').forEach(c => c.classList.remove('active'));
    if (cardEl) cardEl.classList.add('active');
    selectedAspectFlag = arFlag;
    updateImageStats();
}

function appendImageStyle(styleText) {
    const textarea = document.getElementById('imagePromptInput');
    if (!textarea) return;
    const current = textarea.value.trim();
    if (!current) textarea.value = styleText;
    else textarea.value = current + ', ' + styleText;
    onImagePromptInputChanged();
    textarea.focus();
}

function updateImageStats() {
    const statsEl = document.getElementById('imagePromptStats');
    const select = document.getElementById('imagePromptPlatform');
    const engine = select ? select.options[select.selectedIndex].text : 'Midjourney v6';
    if (statsEl) statsEl.textContent = `${engine} • ${selectedAspectFlag.replace('--ar ', '')}`;
}

async function generateImagePrompt() {
    const input     = document.getElementById('imagePromptInput').value.trim();
    const platform  = document.getElementById('imagePromptPlatform').value;
    const resultBox = document.getElementById('imagePromptResultBox');
    const copyRow   = document.getElementById('imagePromptCopyRow');
    const btn       = document.getElementById('imagePromptGenerateBtn');

    if (!input) {
        alert('Please describe your image concept first.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Synthesizing Prompt...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

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
            alert(data.error);
            return;
        }

        let finalResult = data.result;
        if (selectedAspectFlag && !finalResult.includes('--ar')) {
            finalResult = finalResult.trim() + ' ' + selectedAspectFlag;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = `<div style="font-family:var(--font-mono); font-size:0.9rem; line-height:1.7; color:#38bdf8;">${finalResult}</div>`;
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🎨 Synthesize Image Prompt';
    }
}

function copyImagePromptResult() {
    const resultBox = document.getElementById('imagePromptResultBox');
    const copyBtn   = document.getElementById('imagePromptCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent.trim(), copyBtn);
}

function copyImaginePrompt() {
    const resultBox = document.getElementById('imagePromptResultBox');
    if (!resultBox || !resultBox.textContent.trim()) return;
    const text = `/imagine prompt: ${resultBox.textContent.trim()}`;
    _copyText(text, null);
    alert('Copied to clipboard with /imagine prompt!');
}

// ─────────────────────────────────────────────
// TOOL 5: 📄 File Analyzer (Document Intelligence)
// ─────────────────────────────────────────────
function initFileDropzone() {
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileAnalyzerInput');
    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            onFileChosen(fileInput);
        }
    });
}

function onFileChosen(input) {
    const nameEl = document.getElementById('fileAnalyzerFileName');
    const titleEl = document.getElementById('dropzoneTitle');
    if (!nameEl) return;

    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 8 * 1024 * 1024) {
            nameEl.textContent = '⚠️ File too large — max 8 MB';
            nameEl.style.color = '#f87171';
            input.value = '';
        } else {
            const kb = Math.round(file.size / 1024);
            nameEl.textContent = `${file.name} (${kb} KB ready)`;
            nameEl.style.color = '#38bdf8';
            if (titleEl) titleEl.textContent = '📄 Document Linked';
        }
    } else {
        nameEl.textContent = 'Supports PDF and TXT up to 8MB';
        nameEl.style.color = '';
        if (titleEl) titleEl.textContent = 'Drop document or click to browse';
    }
}

function setFileQuery(queryText) {
    const textarea = document.getElementById('fileAnalyzerQuestion');
    if (textarea) {
        textarea.value = queryText;
        textarea.focus();
    }
}

function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function analyzeFile() {
    const fileInput = document.getElementById('fileAnalyzerInput');
    const question  = document.getElementById('fileAnalyzerQuestion').value.trim();
    const resultBox = document.getElementById('fileAnalyzerResultBox');
    const copyRow   = document.getElementById('fileAnalyzerCopyRow');
    const btn       = document.getElementById('fileAnalyzerAnalyzeBtn');
    const statsEl   = document.getElementById('fileAnalyzerStats');

    const file = fileInput.files[0];
    if (!file) {
        alert('Please choose or drop a PDF / TXT document first.');
        return;
    }

    if (file.size > 8 * 1024 * 1024) {
        alert('File is too large. Max 8MB.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Extracting Intelligence...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

    try {
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
            alert(data.error);
            return;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = parseMarkdownToHtml(data.result);
            if (statsEl) {
                statsEl.textContent = `${file.name} • Analyzed`;
            }
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#128196; Run Document Intelligence';
    }
}

function copyFileAnalyzerResult() {
    const resultBox = document.getElementById('fileAnalyzerResultBox');
    const copyBtn   = document.getElementById('fileAnalyzerCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent.trim(), copyBtn);
}

function downloadFileAnalysis() {
    const resultBox = document.getElementById('fileAnalyzerResultBox');
    if (!resultBox || !resultBox.textContent.trim()) return;
    const text = resultBox.textContent.trim();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noxtary-document-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// TOOL 6: 🏷️ Name Generator (Creative Identity Matrix)
// ─────────────────────────────────────────────
function onNameGenInputChanged() {
    const input = document.getElementById('nameGenInput')?.value || '';
    const charCountEl = document.getElementById('nameGenCharCount');
    if (charCountEl) charCountEl.textContent = input.length + ' chars';
}

function selectNameGenCategory(catVal) {
    const chips = document.querySelectorAll('#nameGenCategoryChips .ai-chip-pill');
    chips.forEach(c => {
        if (c.getAttribute('data-value') === catVal) c.classList.add('active');
        else c.classList.remove('active');
    });
    const select = document.getElementById('nameGenCategory');
    if (select) select.value = catVal;
}

async function generateNames() {
    const input     = document.getElementById('nameGenInput').value.trim();
    const category  = document.getElementById('nameGenCategory').value;
    const resultBox = document.getElementById('nameGenResultBox');
    const copyRow   = document.getElementById('nameGenCopyRow');
    const btn       = document.getElementById('nameGenGenerateBtn');
    const statsEl   = document.getElementById('nameGenStats');

    if (!input) {
        alert('Please describe what you need a name for.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Generating Names...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-name-generator', {
            body: { input, category }
        });

        if (error) {
            alert('Something went wrong. Please try again.');
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (data.error.includes('رصيد غير كافٍ')) {
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            return;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = parseMarkdownToHtml(data.result);
            if (statsEl) {
                const lines = data.result.split('\n').filter(l => l.trim().length > 0).length;
                statsEl.textContent = `${category.replace('_', ' ').toUpperCase()} • Generated`;
            }
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '&#127991;&#65039; Generate Names';
    }
}

function copyNameGenResult() {
    const resultBox = document.getElementById('nameGenResultBox');
    const copyBtn   = document.getElementById('nameGenCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent.trim(), copyBtn);
}

// ─────────────────────────────────────────────
// TOOL 7: 💻 Code Assistant (Neural Developer Suite)
// ─────────────────────────────────────────────
function onCodeInputChanged() {
    const input = document.getElementById('codeAssistantInput')?.value || '';
    const charCountEl = document.getElementById('codeAssistantCharCount');
    if (charCountEl) charCountEl.textContent = input.length + ' chars';
}

function selectCodeMode(modeVal) {
    const chips = document.querySelectorAll('#codeAssistantModeChips .ai-chip-pill');
    chips.forEach(c => {
        if (c.getAttribute('data-value') === modeVal) c.classList.add('active');
        else c.classList.remove('active');
    });
    const select = document.getElementById('codeAssistantMode');
    if (select) select.value = modeVal;
    onCodeModeChange(modeVal);
}

function onCodeModeChange(modeVal) {
    const targetWrapper = document.getElementById('codeAssistantTargetLangWrapper');
    if (targetWrapper) {
        targetWrapper.style.display = modeVal === 'convert' ? 'block' : 'none';
    }
}

async function analyzeCode() {
    const code        = document.getElementById('codeAssistantInput').value.trim();
    const mode        = document.getElementById('codeAssistantMode').value;
    const targetLang  = document.getElementById('codeAssistantTargetLang')?.value.trim() || '';
    const resultBox   = document.getElementById('codeAssistantResultBox');
    const copyRow     = document.getElementById('codeAssistantCopyRow');
    const btn         = document.getElementById('codeAssistantAnalyzeBtn');
    const statsEl     = document.getElementById('codeAssistantStats');

    if (!code) {
        alert('Please paste some code first.');
        return;
    }

    if (mode === 'convert' && !targetLang) {
        alert('Please specify the target language.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '&#9203; Analyzing Code...';

    if (resultBox) {
        resultBox.classList.remove('empty');
        resultBox.innerHTML = '<div class="chat-typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    }

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-code-assistant', {
            body: { code, mode, target_language: targetLang }
        });

        if (error) {
            alert('Something went wrong. Please try again.');
            console.error('Edge Function error:', error);
            return;
        }

        if (data?.error) {
            if (data.error.includes('رصيد غير كافٍ')) {
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            return;
        }

        if (resultBox) {
            resultBox.classList.remove('empty');
            resultBox.innerHTML = parseMarkdownToHtml(data.result);
            if (statsEl) {
                statsEl.textContent = `${mode.toUpperCase()} • Completed`;
            }
        }
        if (copyRow) copyRow.style.display = 'flex';
        updateCreditsUI(data);

    } catch (err) {
        console.error('AI Studio: Unexpected error', err);
        alert('Something went wrong. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💻 Analyze Code';
    }
}

function copyCodeAssistantResult() {
    const resultBox = document.getElementById('codeAssistantResultBox');
    const copyBtn   = document.getElementById('codeAssistantCopyBtn');
    if (!resultBox || !resultBox.textContent.trim()) return;
    _copyText(resultBox.textContent.trim(), copyBtn);
}

// ─────────────────────────────────────────────
// TOOL 8: 📚 Book Writer (Continuous Project Studio)
// ─────────────────────────────────────────────
let currentBookProject = null;

function toggleBookCreateForm(show) {
    const formCard = document.getElementById('bookCreateFormCard');
    if (!formCard) return;
    if (typeof show === 'boolean') {
        formCard.style.display = show ? 'block' : 'none';
    } else {
        formCard.style.display = formCard.style.display === 'none' ? 'block' : 'none';
    }
}

async function loadBookProjects() {
    if (typeof supabaseClient === 'undefined') return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    const listContainer = document.getElementById('bookProjectsList');
    if (!listContainer) return;

    try {
        const { data: projects, error } = await supabaseClient
            .from('ai_book_projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Book Writer: Error loading projects', error);
            listContainer.innerHTML = '<div style="padding:30px; text-align:center; opacity:0.7;">⚠️ Could not load projects. Please try again.</div>';
            return;
        }

        if (!projects || projects.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; border: 1px dashed rgba(100, 181, 246, 0.2); border-radius: 12px; background: rgba(0,0,0,0.15);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">📚</div>
                    <h4 style="font-size: 1rem; color: #fff; margin-bottom: 4px;">No Book Projects Yet</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Create your first AI book, novel, or story to start generating pages.</p>
                    <button class="ai-action-btn" onclick="toggleBookCreateForm(true)" style="background: rgba(37,99,235,0.2); border-color: rgba(37,99,235,0.5); color:#93c5fd; padding:8px 16px;">
                        ➕ Create First Project
                    </button>
                </div>`;
            return;
        }

        listContainer.innerHTML = projects.map(p => {
            const isComplete = p.status === 'completed' || (p.current_page_number >= p.total_pages && p.total_pages > 0);
            const statusBadge = isComplete 
                ? '<span style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); font-size: 0.72rem; padding: 2px 8px; border-radius: 20px; font-weight: 600;">✅ Complete</span>'
                : '<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 0.72rem; padding: 2px 8px; border-radius: 20px; font-weight: 600;">⚡ Active</span>';

            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; transition: all 0.2s ease;">
                    <div style="flex: 1; min-width: 220px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <strong style="color: #fff; font-size: 1rem;">${escapeHtml(p.title || 'Untitled Project')}</strong>
                            ${statusBadge}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.83rem; display: flex; gap: 12px; flex-wrap: wrap;">
                            <span>📖 ${escapeHtml(p.book_type.toUpperCase())}</span>
                            <span>🌐 ${escapeHtml(p.language)}</span>
                            <span>📄 Page <strong>${p.current_page_number}</strong> of <strong>${p.total_pages}</strong></span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="openBookProject(${p.id})" class="ai-action-btn" style="background: rgba(37, 99, 235, 0.2); border-color: rgba(37, 99, 235, 0.4); color: #93c5fd; padding: 8px 18px; font-weight: 600;">
                            📖 Open
                        </button>
                        <button onclick="deleteBookProject(${p.id})" style="background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.35); color: #fca5a5; border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s ease;" title="Delete Project">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Book Writer: Failed to load projects', err);
    }
}

async function createBookProject() {
    const brief    = document.getElementById('bookNewPrompt').value.trim();
    const type     = document.getElementById('bookNewType').value;
    const language = document.getElementById('bookNewLanguage').value.trim() || 'English';
    const pages    = parseInt(document.getElementById('bookNewPages').value) || 10;
    const title    = document.getElementById('bookNewTitle').value.trim() || 'Untitled Project';
    const btn      = document.getElementById('bookCreateBtn');

    if (!brief) {
        alert('Please describe your book idea first.');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Creating Project...';
    }

    try {
        const { data, error } = await supabaseClient
            .from('ai_book_projects')
            .insert({
                user_id: session.user.id,
                title: title,
                book_type: type,
                language: language,
                total_pages: pages,
                brief_prompt: brief,
                current_page_number: 0,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('Book Writer creation error:', error);
            alert('Failed to create project.');
            return;
        }

        // Reset form
        document.getElementById('bookNewPrompt').value = '';
        document.getElementById('bookNewTitle').value = '';
        toggleBookCreateForm(false);

        await openBookProject(data.id);

    } catch (err) {
        console.error('Book Writer error:', err);
        alert('Failed to create project.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Create & Launch Project';
        }
    }
}

async function deleteBookProject(projectId) {
    if (!confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
        const { error } = await supabaseClient
            .from('ai_book_projects')
            .delete()
            .eq('id', projectId);

        if (error) {
            alert('Failed to delete project.');
            console.error(error);
            return;
        }
        await loadBookProjects();
    } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project.');
    }
}

async function openBookProject(projectId) {
    try {
        const { data: project, error } = await supabaseClient
            .from('ai_book_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            alert('Failed to load project.');
            return;
        }

        currentBookProject = project;
        document.getElementById('bookProjectsListWrapper').style.display = 'none';
        document.getElementById('bookProjectView').style.display = 'block';
        document.getElementById('bookProjectTitle').textContent = project.title || 'Untitled Project';

        const metaEl = document.getElementById('bookProjectMeta');
        if (metaEl) {
            metaEl.textContent = `${project.book_type.toUpperCase()} • ${project.language} • Page ${project.current_page_number} of ${project.total_pages}`;
        }

        const pageContentEl = document.getElementById('bookPageContent');
        const generateBtn   = document.getElementById('bookGenerateBtn');
        const warningEl     = document.getElementById('bookPageWarning');

        if (project.current_page_number === 0) {
            pageContentEl.textContent = 'No pages generated yet. Click "Generate Page 1" below to start writing.';
            generateBtn.textContent = '✨ Generate Page 1';
            generateBtn.disabled = false;
            warningEl.style.display = 'none';
        } else {
            pageContentEl.textContent = project.last_page_content || 'No content found for this page.';
            const isCompleted = project.status === 'completed' || project.current_page_number >= project.total_pages;
            warningEl.style.display = isCompleted ? 'none' : 'block';
            generateBtn.textContent = isCompleted
                ? '✅ Book Complete'
                : `✨ Generate Page ${project.current_page_number + 1}`;
            generateBtn.disabled = isCompleted;
        }

    } catch (err) {
        console.error('Error opening book project:', err);
        alert('Failed to load project.');
    }
}

function closeBookProject() {
    currentBookProject = null;
    document.getElementById('bookProjectView').style.display = 'none';
    document.getElementById('bookProjectsListWrapper').style.display = 'block';
    loadBookProjects();
}

async function generateBookPage() {
    if (!currentBookProject) return;

    const btn = document.getElementById('bookGenerateBtn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = '&#9203; Writing Page...';

    try {
        const { data, error } = await supabaseClient.functions.invoke('ai-book-writer', {
            body: { project_id: currentBookProject.id }
        });

        if (error) {
            alert('Something went wrong. Please try again.');
            console.error('Book Writer Edge Function error:', error);
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        if (data?.error) {
            if (data.error.includes('رصيد غير كافٍ')) {
                alert('Not enough credits.');
            } else {
                alert(data.error);
            }
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        document.getElementById('bookPageContent').textContent = data.result;
        
        const isComplete = data.is_complete || data.page_number >= (data.total_pages || currentBookProject.total_pages);
        document.getElementById('bookPageWarning').style.display = isComplete ? 'none' : 'block';
        
        btn.textContent = isComplete ? '✅ Book Complete' : `✨ Generate Page ${data.page_number + 1}`;
        btn.disabled = isComplete;

        currentBookProject.current_page_number = data.page_number;
        currentBookProject.last_page_content   = data.result;
        currentBookProject.status              = isComplete ? 'completed' : 'active';

        const metaEl = document.getElementById('bookProjectMeta');
        if (metaEl) {
            metaEl.textContent = `${currentBookProject.book_type.toUpperCase()} • ${currentBookProject.language} • Page ${data.page_number} of ${data.total_pages || currentBookProject.total_pages}`;
        }

        updateCreditsUI(data);

    } catch (err) {
        console.error('Book Writer generation error:', err);
        alert('Something went wrong. Please try again.');
        btn.textContent = originalText;
    } finally {
        if (!currentBookProject || currentBookProject.status !== 'completed') {
            btn.disabled = false;
        }
    }
}

function copyBookPage() {
    const text = document.getElementById('bookPageContent')?.textContent || '';
    if (!text.trim()) return;
    const btn = document.getElementById('bookCopyBtn');
    _copyText(text, btn);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─────────────────────────────────────────────
// UNIVERSAL FAVORITES & ACTIVITY LOGIC
// ─────────────────────────────────────────────
async function saveToFavorites(toolName, inputText, outputText, btnElement) {
    if (typeof supabaseClient === 'undefined') return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) {
        alert('Please sign in first.');
        document.getElementById('loginModal')?.classList.add('active');
        return;
    }

    if (!outputText || !outputText.trim()) {
        alert('No output to save yet.');
        return;
    }

    const originalText = btnElement ? btnElement.innerHTML : '⭐ Save';
    if (btnElement) {
        btnElement.innerHTML = '⏳';
        btnElement.disabled = true;
    }

    try {
        const { error } = await supabaseClient.rpc('add_to_favorites', {
            p_tool_name: toolName,
            p_input_text: inputText || '',
            p_output_text: outputText
        });

        if (error) {
            console.error('Save to favorites error:', error);
            alert('Failed to save.');
            if (btnElement) {
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
            }
            return;
        }

        if (btnElement) {
            btnElement.innerHTML = '✅ Saved';
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
            }, 2000);
        }
    } catch (err) {
        console.error('Unexpected favorites error:', err);
        alert('Failed to save.');
        if (btnElement) {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
        }
    }
}

function savePromptBuilderFavorite(btn) {
    const input = document.getElementById('promptInput')?.value || '';
    const output = document.getElementById('resultBox')?.textContent || '';
    saveToFavorites('prompt_builder', input, output, btn);
}

function saveWriterFavorite(btn) {
    const input = document.getElementById('writerTopic')?.value || '';
    const output = document.getElementById('writerResultBox')?.textContent || '';
    saveToFavorites('ai_writer', input, output, btn);
}

function saveImagePromptFavorite(btn) {
    const input = document.getElementById('imageSubject')?.value || '';
    const output = document.getElementById('imagePromptResultBox')?.textContent || '';
    saveToFavorites('image_prompt', input, output, btn);
}

function saveFileAnalyzerFavorite(btn) {
    const input = document.getElementById('fileQueryInput')?.value || (selectedFileData ? selectedFileData.name : 'Document Intelligence');
    const output = document.getElementById('fileAnalyzerResultBox')?.textContent || '';
    saveToFavorites('file_analyzer', input, output, btn);
}

function saveNameGenFavorite(btn) {
    const input = document.getElementById('nameGenInput')?.value || '';
    const output = document.getElementById('nameGenResultBox')?.textContent || '';
    saveToFavorites('name_generator', input, output, btn);
}

function saveCodeAssistantFavorite(btn) {
    const input = document.getElementById('codeAssistantInput')?.value || '';
    const output = document.getElementById('codeAssistantResultBox')?.textContent || '';
    saveToFavorites('code_assistant', input, output, btn);
}

// ─────────────────────────────────────────────
// TOOL 9: 📜 History & Favorites
// ─────────────────────────────────────────────
function switchHistoryFavsSubTab(subTab) {
    const historySec = document.getElementById('historySection');
    const favsSec = document.getElementById('favoritesSection');
    const subTabHistBtn = document.getElementById('subTabHistory');
    const subTabFavBtn = document.getElementById('subTabFavorites');

    if (subTab === 'history') {
        if (historySec) historySec.style.display = 'block';
        if (favsSec) favsSec.style.display = 'none';
        if (subTabHistBtn) subTabHistBtn.classList.add('active');
        if (subTabFavBtn) subTabFavBtn.classList.remove('active');
        loadHistory();
    } else {
        if (historySec) historySec.style.display = 'none';
        if (favsSec) favsSec.style.display = 'block';
        if (subTabHistBtn) subTabHistBtn.classList.remove('active');
        if (subTabFavBtn) subTabFavBtn.classList.add('active');
        loadFavorites();
    }
}

async function loadHistory() {
    if (typeof supabaseClient === 'undefined') return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    const container = document.getElementById('historyList');
    if (!container) return;

    try {
        const { data: history, error } = await supabaseClient
            .from('ai_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('History load error:', error);
            container.innerHTML = '<div style="padding:30px; text-align:center; opacity:0.7;">⚠️ Could not load history.</div>';
            return;
        }

        if (!history || history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; border: 1px dashed rgba(100, 181, 246, 0.2); border-radius: 12px; background: rgba(0,0,0,0.15);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🕒</div>
                    <h4 style="font-size: 1rem; color: #fff; margin-bottom: 4px;">No History Yet</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Generate content with any AI tool to see your recent activity here.</p>
                </div>`;
            return;
        }

        container.innerHTML = history.map(h => {
            const dateStr = h.created_at ? new Date(h.created_at).toLocaleString() : '';
            const previewText = (h.output_text || '').slice(0, 300) + ((h.output_text || '').length > 300 ? '...' : '');
            const encodedInput = encodeURIComponent(h.input_text || '');
            const encodedOutput = encodeURIComponent(h.output_text || '');

            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px 20px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(59, 130, 246, 0.12); padding: 2px 8px; border-radius: 6px;">
                            ${escapeHtml(h.tool_name || 'AI TOOL')}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
                    </div>
                    ${h.input_text ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px; opacity: 0.85;"><strong>Input:</strong> ${escapeHtml((h.input_text).slice(0, 150))}${(h.input_text).length > 150 ? '...' : ''}</div>` : ''}
                    <div style="font-size: 0.88rem; color: #f8fafc; white-space: pre-wrap; line-height: 1.6; max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">${escapeHtml(previewText)}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${h.output_text ? `
                            <button class="ai-action-btn" onclick="saveToFavorites('${escapeHtml(h.tool_name)}', decodeURIComponent('${encodedInput}'), decodeURIComponent('${encodedOutput}'), this)" style="padding: 4px 12px; font-size: 0.78rem;">
                                ⭐ Save to Favorites
                            </button>
                            <button class="ai-action-btn" onclick="_copyText(decodeURIComponent('${encodedOutput}'), this)" style="padding: 4px 12px; font-size: 0.78rem;">
                                📋 Copy
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('History load exception:', err);
    }
}

async function loadFavorites() {
    if (typeof supabaseClient === 'undefined') return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    const container = document.getElementById('favoritesList');
    if (!container) return;

    try {
        const { data: favorites, error } = await supabaseClient
            .from('ai_favorites')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Favorites load error:', error);
            container.innerHTML = '<div style="padding:30px; text-align:center; opacity:0.7;">⚠️ Could not load favorites.</div>';
            return;
        }

        if (!favorites || favorites.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; border: 1px dashed rgba(100, 181, 246, 0.2); border-radius: 12px; background: rgba(0,0,0,0.15);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">⭐</div>
                    <h4 style="font-size: 1rem; color: #fff; margin-bottom: 4px;">No Saved Favorites Yet</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Click the "⭐ Save" button on any generated result to bookmark it here.</p>
                </div>`;
            return;
        }

        container.innerHTML = favorites.map(f => {
            const dateStr = f.created_at ? new Date(f.created_at).toLocaleString() : '';
            const encodedOutput = encodeURIComponent(f.output_text || '');

            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px 20px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(251, 191, 36, 0.12); padding: 2px 8px; border-radius: 6px;">
                            ⭐ ${escapeHtml(f.tool_name || 'FAVORITE')}
                        </span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
                            <button onclick="deleteFavorite(${f.id})" style="background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.35); color: #fca5a5; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease;">
                                🗑️ Remove
                            </button>
                        </div>
                    </div>
                    ${f.input_text ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px; opacity: 0.85;"><strong>Input:</strong> ${escapeHtml((f.input_text).slice(0, 150))}${(f.input_text).length > 150 ? '...' : ''}</div>` : ''}
                    <div style="font-size: 0.88rem; color: #f8fafc; white-space: pre-wrap; line-height: 1.6; max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">${escapeHtml(f.output_text || '')}</div>
                    <button class="ai-action-btn" onclick="_copyText(decodeURIComponent('${encodedOutput}'), this)" style="padding: 4px 14px; font-size: 0.8rem;">
                        📋 Copy Output
                    </button>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Favorites load exception:', err);
    }
}

async function deleteFavorite(favoriteId) {
    if (!confirm('Remove this from favorites?')) return;
    try {
        const { error } = await supabaseClient
            .from('ai_favorites')
            .delete()
            .eq('id', favoriteId);

        if (error) {
            alert('Failed to remove favorite.');
            console.error(error);
            return;
        }
        await loadFavorites();
    } catch (err) {
        console.error('Delete favorite exception:', err);
        alert('Failed to remove favorite.');
    }
}

// ─────────────────────────────────────────────
// Shared Helpers & Clipboard
// ─────────────────────────────────────────────
function updateCreditsUI(data) {
    if (!data) return;
    if (data.unlimited) {
        const display = document.getElementById('creditsDisplay');
        if (display) {
            display.textContent = '👑 Unlimited Lifetime Pass';
            display.classList.add('credits-card--unlimited');
        }
        const subBtn = document.getElementById('aiStudioSubscribeBtn');
        if (subBtn) subBtn.remove();
    } else if (typeof data.remaining_balance === 'number') {
        const display = document.getElementById('creditsDisplay');
        if (display) display.textContent = '⚡ ' + data.remaining_balance + ' Credits';
    }
}

async function _copyText(text, btnEl) {
    try {
        await navigator.clipboard.writeText(text);
        _showCopiedFeedback(btnEl);
    } catch (err) {
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
            alert('Could not copy text automatically. Please select and copy.');
        }
        document.body.removeChild(textarea);
    }
}

function _showCopiedFeedback(btn) {
    if (!btn) return;
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copied!';
    setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
    }, 2000);
}
