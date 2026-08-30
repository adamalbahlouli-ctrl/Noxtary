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
// Tab Switcher — supports all five tools
// ─────────────────────────────────────────────
function switchTab(tab) {
    const tabs = ['aiChat', 'promptBuilder', 'aiWriter', 'imagePrompt', 'fileAnalyzer'];

    const displayType = {
        aiChat:        'flex',
        promptBuilder: 'block',
        aiWriter:      'block',
        imagePrompt:   'block',
        fileAnalyzer:  'block'
    };

    tabs.forEach(function (t) {
        const panelId = {
            aiChat:        'panelAiChat',
            promptBuilder: 'panelPromptBuilder',
            aiWriter:      'panelAiWriter',
            imagePrompt:   'panelImagePrompt',
            fileAnalyzer:  'panelFileAnalyzer'
        }[t];
        const btnId = {
            aiChat:        'tabAiChat',
            promptBuilder: 'tabPromptBuilder',
            aiWriter:      'tabAiWriter',
            imagePrompt:   'tabImagePrompt',
            fileAnalyzer:  'tabFileAnalyzer'
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
        fileAnalyzer:  'tabFileAnalyzer'
    }[tab]);

    if (tabsContainer && activeBtn) {
        const scrollOffset = activeBtn.offsetLeft - (tabsContainer.clientWidth / 2) + (activeBtn.clientWidth / 2);
        tabsContainer.scrollTo({ left: Math.max(0, scrollOffset), behavior: 'smooth' });
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
