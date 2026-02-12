import { verifyToken } from './verifytoken.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE     = 20;
const MSG_PAGE_SIZE = 30;

// ─── State ────────────────────────────────────────────────────────────────────
let chatsOffset    = 0;
let allChatsLoaded = false;

let currentChatId   = null;
let currentUserId   = null;
let currentChatName = null;

let ws            = null;
let msgOffset     = 0;
let allMsgsLoaded = false;
let isLoadingMsgs = false;

// ─── Mobile helpers ───────────────────────────────────────────────────────────

/** True when the viewport is in "mobile" mode (single-panel) */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Show the chat panel and slide the sidebar off-screen.
 * On desktop this is a no-op (both panels are always visible).
 */
function showChatPanel() {
    if (!isMobile()) return;
    document.getElementById('sidebar').classList.add('chat-open');
    document.getElementById('chatArea').classList.add('chat-open');
}

/** Return to the sidebar (mobile back button). */
function showSidebarPanel() {
    if (!isMobile()) return;
    document.getElementById('sidebar').classList.remove('chat-open');
    document.getElementById('chatArea').classList.remove('chat-open');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const res = await verifyToken();
    if (!res) {
        window.location.replace('/');
        return;
    }

    currentUserId = await fetchCurrentUserId();

    if (!currentUserId) {
        console.error('Could not get user_id — WebSocket will not work');
    } else {
        console.log('Current user_id:', currentUserId);
    }

    initMessenger();
    loadChats();
});

// ─── Get current user ─────────────────────────────────────────────────────────
async function fetchCurrentUserId() {
    try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user?.id ?? null;
    } catch (e) {
        console.error('Failed to fetch current user id:', e);
        return null;
    }
}

// ─── Messenger UI init ────────────────────────────────────────────────────────
function initMessenger() {
    const menuBtn           = document.getElementById('menuBtn');
    const menuOverlay       = document.getElementById('menuOverlay');
    const logoutBtn         = document.getElementById('logoutBtn');
    const aboutBtn          = document.getElementById('aboutBtn');
    const sessionsBtn       = document.getElementById('sessionsBtn');
    const addUserBtn        = document.getElementById('addUserBtn');
    const aboutBackBtn      = document.getElementById('aboutBackBtn');
    const sessionsBackBtn   = document.getElementById('sessionsBackBtn');
    const addUserBackBtn    = document.getElementById('addUserBackBtn');
    const sendBtn           = document.getElementById('sendBtn');
    const messageInput      = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const backToSidebarBtn  = document.getElementById('backToSidebarBtn');
    const addUserSubmitBtn  = document.getElementById('addUserSubmitBtn');
    const emojiBtn          = document.getElementById('emojiBtn');
    const emojiPickerOverlay = document.getElementById('emojiPickerOverlay');
    const emojiPicker       = document.querySelector('emoji-picker');

    // ── Emoji Picker ──────────────────────────────────────────────────────────
    if (emojiBtn && emojiPickerOverlay && emojiPicker) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPickerOverlay.style.display = 'flex';
        });

        emojiPickerOverlay.addEventListener('click', (e) => {
            if (e.target === emojiPickerOverlay) {
                emojiPickerOverlay.style.display = 'none';
            }
        });

        emojiPicker.addEventListener('emoji-click', (event) => {
            const emoji = event.detail.unicode;
            messageInput.value += emoji;
            messageInput.focus();
            emojiPickerOverlay.style.display = 'none';
        });
    }

    // ── Menu ──────────────────────────────────────────────────────────────────
    menuBtn.addEventListener('click', toggleMenu);

    menuOverlay.addEventListener('click', () => {
        if (document.getElementById('dropdownMenu').classList.contains('active'))  toggleMenu();
        if (document.getElementById('aboutMenu').classList.contains('active'))     closeAboutMenu();
        if (document.getElementById('sessionsMenu').classList.contains('active'))  closeSessionsMenu();
        if (document.getElementById('addUserMenu').classList.contains('active'))   closeAddUserMenu();
    });

    logoutBtn.addEventListener('click', logout);

    aboutBtn.addEventListener('click', () => {
        toggleMenu();
        setTimeout(() => openAboutMenu(), 100);
    });
    aboutBackBtn.addEventListener('click', closeAboutMenu);

    sessionsBtn.addEventListener('click', () => {
        toggleMenu();
        setTimeout(() => openSessionsMenu(), 100);
    });
    sessionsBackBtn.addEventListener('click', closeSessionsMenu);

    addUserBtn.addEventListener('click', () => {
        toggleMenu();
        setTimeout(() => openAddUserMenu(), 100);
    });
    addUserBackBtn.addEventListener('click', closeAddUserMenu);

    addUserSubmitBtn.addEventListener('click', handleAddUser);

    // Add user on Enter key
    const addUserInput = document.getElementById('addUserInput');
    if (addUserInput) {
        addUserInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUser();
            }
        });
    }

    // ── Mobile back button ────────────────────────────────────────────────────
    if (backToSidebarBtn) {
        backToSidebarBtn.addEventListener('click', () => {
            if (ws) {
                ws.close();
                ws = null;
            }
            showSidebarPanel();
        });
    }

    // ── Hardware back button (Android) ────────────────────────────────────────
    window.addEventListener('popstate', () => {
        if (isMobile() && document.getElementById('chatArea').classList.contains('chat-open')) {
            showSidebarPanel();
            // Push a state again so the next back press closes the browser tab
            history.pushState(null, '', location.href);
        }
    });
    // Initial history entry so popstate fires correctly
    history.pushState(null, '', location.href);

    // ── Chats infinite scroll ─────────────────────────────────────────────────
    const chatsList = document.querySelector('.chats-list');
    chatsList.addEventListener('scroll', () => {
        if (allChatsLoaded) return;
        if (chatsList.scrollTop + chatsList.clientHeight >= chatsList.scrollHeight - 10) {
            loadChats();
        }
    });

    // ── Send ──────────────────────────────────────────────────────────────────
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ── Messages infinite scroll ──────────────────────────────────────────────
    messagesContainer.addEventListener('scroll', () => {
        if (allMsgsLoaded || isLoadingMsgs) return;
        if (messagesContainer.scrollTop < 60) {
            loadMessages(currentChatId, true);
        }
    });

    // ── iOS keyboard resize fix ───────────────────────────────────────────────
    // When the keyboard appears, `window.visualViewport` shrinks. We move the
    // input area up so it stays visible above the keyboard.
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window.visualViewport.addEventListener('scroll', handleViewportResize);
    }
}

// ─── iOS / Android keyboard handler ──────────────────────────────────────────
function handleViewportResize() {
    const vv = window.visualViewport;
    if (!vv) return;
    const messenger = document.querySelector('.messenger-container');
    if (!messenger) return;
    // Shrink the container to the visible viewport so the input stays above keyboard
    messenger.style.height = `${vv.height}px`;
    messenger.style.marginTop = `${vv.offsetTop}px`;
}

// ─── Menu helpers ─────────────────────────────────────────────────────────────
function toggleMenu() {
    document.getElementById('dropdownMenu').classList.toggle('active');
    document.getElementById('menuOverlay').classList.toggle('active');
}

async function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        const res = await fetch('/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!res.ok) {
            alert('Ошибка выхода');
            return;
        }
        location.reload();
    }
}

function openAboutMenu() {
    document.getElementById('aboutMenu').classList.add('active');
    document.getElementById('menuOverlay').classList.add('active');
}
function closeAboutMenu() {
    document.getElementById('aboutMenu').classList.remove('active');
    document.getElementById('menuOverlay').classList.remove('active');
}
function openSessionsMenu() {
    document.getElementById('sessionsMenu').classList.add('active');
    document.getElementById('menuOverlay').classList.add('active');
    loadSessions();
}
function closeSessionsMenu() {
    document.getElementById('sessionsMenu').classList.remove('active');
    document.getElementById('menuOverlay').classList.remove('active');
}

function openAddUserMenu() {
    document.getElementById('addUserMenu').classList.add('active');
    document.getElementById('menuOverlay').classList.add('active');
    // Clear previous input and messages
    document.getElementById('addUserInput').value = '';
    document.getElementById('addUserError').style.display = 'none';
    document.getElementById('addUserSuccess').style.display = 'none';
}

function closeAddUserMenu() {
    document.getElementById('addUserMenu').classList.remove('active');
    document.getElementById('menuOverlay').classList.remove('active');
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
async function loadSessions() {
    const sessionsList = document.getElementById('sessionsList');
    sessionsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--gray-text);">Загрузка...</div>';

    try {
        const res = await fetch('/auth/me', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load sessions');

        const data     = await res.json();
        const sessions = data.sessions;

        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="no-sessions">
                    <div class="no-sessions-icon">📱</div>
                    <div class="no-sessions-text">Нет активных сессий</div>
                </div>`;
            return;
        }

        sessionsList.innerHTML = '';
        const currentSessionId = getCurrentSessionId();
        sessions.forEach(session => {
            sessionsList.appendChild(createSessionItem(session, currentSessionId));
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        sessionsList.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading sessions</div>`;
    }
}

function getCurrentSessionId() {
    for (let cookie of document.cookie.split(';')) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session_id') return value;
    }
    return null;
}

function createSessionItem(session, currentSessionId) {
    const div       = document.createElement('div');
    const isCurrent = session.session_id === currentSessionId;
    div.className   = `session-item${isCurrent ? ' current' : ''}`;

    const deviceIcon  = getDeviceIcon(session.fingerprint);
    const deviceName  = parseUserAgent(session.fingerprint);
    const expiresDate = new Date(session.expires_at);

    div.innerHTML = `
        <div class="session-header">
            <div class="session-icon">${deviceIcon}</div>
            <div class="session-device">
                <div class="session-device-name">${deviceName.browser}</div>
                <div class="session-device-type">${deviceName.os}</div>
            </div>
        </div>
        <div class="session-info">
            <div class="session-info-row">
                <span class="session-info-label">Session ID</span>
                <span class="session-info-value">${session.session_id.substring(0, 12)}...</span>
            </div>
            <div class="session-info-row">
                <span class="session-info-label">Expires</span>
                <span class="session-info-value">${formatExpiryDate(expiresDate)}</span>
            </div>
        </div>
        ${!isCurrent ? `
            <div class="session-actions">
                <button class="session-terminate-btn" data-session-id="${session.session_id}">
                    Terminate session
                </button>
            </div>` : ''}`;

    if (!isCurrent) {
        div.querySelector('.session-terminate-btn').addEventListener('click', () => {
            terminateSession(session.session_id);
        });
    }
    return div;
}

function getDeviceIcon(userAgent) {
    const ua = (userAgent || '').toLowerCase();
    return (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('tablet') || ua.includes('ipad'))
        ? '📱' : '💻';
}

function parseUserAgent(userAgent = '') {
    let browser = 'Unknown browser';
    let os      = 'Unknown OS';

    if (userAgent.includes('Edg'))                                          browser = 'Edge';
    else if (userAgent.includes('Firefox'))                                 browser = 'Firefox';
    else if (userAgent.includes('Chrome'))                                  browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR'))      browser = 'Opera';

    if (userAgent.includes('Windows NT 10.0'))      os = 'Windows 10/11';
    else if (userAgent.includes('Windows NT 6.3'))  os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2'))  os = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1'))  os = 'Windows 7';
    else if (userAgent.includes('Windows'))         os = 'Windows';
    else if (userAgent.includes('Mac OS X')) {
        const m = userAgent.match(/Mac OS X ([\d_]+)/);
        os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS';
    }
    else if (userAgent.includes('Linux'))   os = 'Linux';
    else if (userAgent.includes('Android')) {
        const m = userAgent.match(/Android ([\d.]+)/);
        os = m ? `Android ${m[1]}` : 'Android';
    }
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) {
        const m = userAgent.match(/OS ([\d_]+)/);
        os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
    }

    return { browser, os };
}

function formatExpiryDate(date) {
    const diff  = date - new Date();
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (diff < 0)  return 'Expired';
    if (days > 30) return `in ${Math.floor(days / 30)} months`;
    if (days > 0)  return `in ${days} days`;
    if (hours > 0) return `in ${hours} hours`;
    return 'less than an hour';
}

async function terminateSession(sessionId) {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    try {
        const res = await fetch(`/auth/internal/session/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to terminate session');
        loadSessions();
    } catch (error) {
        console.error('Error terminating session:', error);
        alert('Error terminating session');
    }
}

// ─── Add User ─────────────────────────────────────────────────────────────────
async function handleAddUser() {
    const input       = document.getElementById('addUserInput');
    const errorDiv    = document.getElementById('addUserError');
    const successDiv  = document.getElementById('addUserSuccess');
    const submitBtn   = document.getElementById('addUserSubmitBtn');
    const username    = input.value.trim();

    // Hide previous messages
    errorDiv.style.display   = 'none';
    successDiv.style.display = 'none';

    if (!username) {
        errorDiv.textContent     = 'Please enter a username';
        errorDiv.style.display   = 'block';
        return;
    }

    // Disable button while processing
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Creating...</span>';

    try {
        const res = await fetch('/chat/chatcrt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ recipient_name: username })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: 'Failed to create chat' }));
            throw new Error(errorData.detail || 'Failed to create chat');
        }

        const data = await res.json();

        // Show success message
        successDiv.textContent   = `Chat created successfully with ${username}!`;
        successDiv.style.display = 'block';
        input.value = '';

        // Reload chats list
        chatsOffset    = 0;
        allChatsLoaded = false;
        document.querySelector('.chats-list').innerHTML = '';
        await loadChats();

        // Close menu after 1.5 seconds
        setTimeout(() => {
            closeAddUserMenu();
        }, 1500);

    } catch (error) {
        console.error('Error creating chat:', error);
        errorDiv.textContent   = error.message || 'Failed to create chat';
        errorDiv.style.display = 'block';
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Create Chat</span>';
    }
}

// ─── Load chats ───────────────────────────────────────────────────────────────
async function loadChats() {
    if (allChatsLoaded) return;

    try {
        const res = await fetch(
            `/chat/chats?value_from=${chatsOffset}&value_to=${chatsOffset + PAGE_SIZE}`,
            { method: 'GET', credentials: 'include' }
        );
        if (!res.ok) {
            console.error('Error loading chats', await res.text());
            return;
        }

        const chats = await res.json();
        if (chats.length === 0) {
            allChatsLoaded = true;
            return;
        }

        chatsOffset += chats.length;
        const chatsList = document.querySelector('.chats-list');

        for (const chat of chats) {
            const other = chat.recipients[0];
            const div   = document.createElement('div');
            div.className       = 'chat-item';
            div.dataset.chatId  = chat.id;

            let lastMessageText = '—';
            let lastMessageTime = '';
            try {
                const lastMsgRes = await fetch(`chat/chats/lastmessage/${chat.id}`, { credentials: 'include' });
                if (lastMsgRes.ok) {
                    const lastMsgData = await lastMsgRes.json();
                    lastMessageText   = lastMsgData.last_message ?? '—';
                    if (lastMsgData.last_message_at) {
                        lastMessageTime = formatChatTimeLocal(lastMsgData.last_message_at);
                    }
                }
            } catch (err) {
                console.warn('Could not fetch last message for chat', chat.id, err);
            }

            div.innerHTML = `
                <div class="avatar">${other.username[0].toUpperCase()}</div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">${escapeHtml(other.username)}</span>
                        <span class="chat-time">${lastMessageTime}</span>
                    </div>
                    <div class="chat-preview" id="preview-${chat.id}">${escapeHtml(lastMessageText)}</div>
                </div>
            `;

            chatsList.appendChild(div);
            div.addEventListener('click', () => openChat(chat.id, other.username, other.id));
        }
    } catch (e) {
        console.error('Error loading chats:', e);
    }
}

function formatChatTimeLocal(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ─── Open chat ────────────────────────────────────────────────────────────────
async function openChat(chatId, chatName, recipientId) {
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    const activeItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (activeItem) activeItem.classList.add('active');

    if (ws) {
        ws.close();
        ws = null;
    }

    currentChatId   = chatId;
    currentChatName = chatName;

    document.getElementById('chatHeaderAvatar').textContent = chatName[0].toUpperCase();
    document.getElementById('chatHeaderName').textContent   = chatName;
    document.getElementById('chatHeaderStatus').textContent = 'online';

    document.getElementById('noChatPlaceholder').style.display = 'none';
    const chatInner = document.getElementById('chatInner');
    chatInner.style.display       = 'flex';
    chatInner.style.flexDirection = 'column';
    chatInner.style.height        = '100%';

    const container   = document.getElementById('messagesContainer');
    container.innerHTML = '';
    msgOffset     = 0;
    allMsgsLoaded = false;

    await loadMessages(chatId, false);

    connectWebSocket(chatId, currentUserId);

    // On mobile, slide to the chat panel
    showChatPanel();

    // Push a history entry so Android back button works
    if (isMobile()) {
        history.pushState({ chatOpen: true }, '', location.href);
    }
}

// ─── Load messages ────────────────────────────────────────────────────────────
async function loadMessages(chatId, prepend = false) {
    if (allMsgsLoaded || isLoadingMsgs) return;
    isLoadingMsgs = true;

    const container = document.getElementById('messagesContainer');
    const loading   = document.getElementById('messagesLoading');
    if (loading) loading.style.display = 'block';

    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    const prevHeight  = container.scrollHeight;

    try {
        const res = await fetch(
            `/chat/chats/messages/${chatId}?value_from=${msgOffset}&value_to=${msgOffset + MSG_PAGE_SIZE}`,
            { method: 'GET', credentials: 'include' }
        );

        if (!res.ok) {
            console.error('Error loading messages', await res.text());
            return;
        }

        let messages = await res.json();

        if (!messages || messages.length === 0) {
            allMsgsLoaded = true;
            if (!prepend && container.children.length === 0) {
                container.innerHTML = '<div class="no-messages">No messages yet. Say hi! 👋</div>';
            }
            return;
        }

        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        msgOffset += messages.length;

        messages.forEach(msg => {
            const el = createMessageElement(msg);
            if (prepend) {
                container.insertBefore(el, container.firstChild);
            } else {
                container.appendChild(el);
            }
        });

        if (prepend) {
            container.scrollTop += container.scrollHeight - prevHeight;
        } else if (wasAtBottom) {
            scrollToBottom();
        }

    } catch (e) {
        console.error('Error loading messages:', e);
    } finally {
        isLoadingMsgs = false;
        if (loading) loading.style.display = 'none';
    }
}

// ─── Create message element ───────────────────────────────────────────────────
function createMessageElement(msg) {
    const isOwn = msg.user_id === currentUserId;
    const div   = document.createElement('div');
    div.className = `message ${isOwn ? 'outgoing' : 'incoming'}`;

    const time = msg.created_at
        ? new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : '';

    div.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(msg.text)}</div>
            <div class="message-time">${time}</div>
        </div>`;

    return div;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
function connectWebSocket(chatId) {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url      = `${protocol}://${location.host}/chat/ws/chat/${chatId}`;
    ws             = new WebSocket(url);

    ws.addEventListener('open', () => {
        console.log('WS connected:', chatId);
        document.getElementById('chatHeaderStatus').textContent = 'connected';
    });

    ws.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            if (typeof data === 'object' && data !== null) {
                appendIncomingMessage(String(data.text ?? ''));
            } else {
                appendIncomingMessage(String(event.data));
            }
        } catch {
            appendIncomingMessage(String(event.data));
        }
    });

    ws.addEventListener('close', () => {
        console.log('WS disconnected');
        document.getElementById('chatHeaderStatus').textContent = 'disconnected';
    });

    ws.addEventListener('error', (e) => {
        console.error('WS error:', e);
    });
}

// ─── Send message ─────────────────────────────────────────────────────────────
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text  = String(input.value).trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    appendOwnMessage(text);
    ws.send(text);
    input.value = '';

    const preview = document.getElementById(`preview-${currentChatId}`);
    if (preview) preview.textContent = text;

    const chatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
    if (chatItem) {
        const timeEl = chatItem.querySelector('.chat-time');
        if (timeEl) {
            timeEl.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
    }
}

// ─── Append messages ──────────────────────────────────────────────────────────
function appendOwnMessage(text) {
    const container = document.getElementById('messagesContainer');
    const noMsg     = container.querySelector('.no-messages');
    if (noMsg) noMsg.remove();

    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const div  = document.createElement('div');
    div.className = 'message outgoing';
    div.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        </div>`;

    container.appendChild(div);
    if (wasAtBottom) scrollToBottom();
}

function appendIncomingMessage(text) {
    const container = document.getElementById('messagesContainer');
    const noMsg     = container.querySelector('.no-messages');
    if (noMsg) noMsg.remove();

    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const div  = document.createElement('div');
    div.className = 'message incoming';
    div.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        </div>`;

    container.appendChild(div);
    if (wasAtBottom) scrollToBottom();

    const preview = document.getElementById(`preview-${currentChatId}`);
    if (preview) preview.textContent = text;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(value) {
    const str = (value === null || value === undefined) ? '' : String(value);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}