import { verifyToken } from './verifytoken.js';

const PAGE_SIZE = 20;
let offset = 0;
let allChatsLoaded = false;

window.addEventListener('DOMContentLoaded', async () => {
    const res = await verifyToken();
    if (!res) {
        window.location.replace("/");
        return;
    }

    initMessenger();
    loadChats();
});

function initMessenger() {
    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const logoutBtn = document.getElementById('logoutBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    const sessionsBtn = document.getElementById('sessionsBtn');
    const aboutBackBtn = document.getElementById('aboutBackBtn');
    const sessionsBackBtn = document.getElementById('sessionsBackBtn');

    menuBtn.addEventListener('click', toggleMenu);


    menuOverlay.addEventListener('click', () => {
        const dropdownMenu = document.getElementById('dropdownMenu');
        const aboutMenu = document.getElementById('aboutMenu');
        const sessionsMenu = document.getElementById('sessionsMenu');

        if (dropdownMenu.classList.contains('active')) {
            toggleMenu();
        }
        if (aboutMenu.classList.contains('active')) {
            closeAboutMenu();
        }
        if (sessionsMenu.classList.contains('active')) {
            closeSessionsMenu();
        }
    });

    logoutBtn.addEventListener('click', logout);

    // About menu
    aboutBtn.addEventListener('click', () => {
        toggleMenu();
        setTimeout(() => openAboutMenu(), 100);
    });

    aboutBackBtn.addEventListener('click', closeAboutMenu);

    // Sessions menu
    sessionsBtn.addEventListener('click', () => {
        toggleMenu();
        setTimeout(() => openSessionsMenu(), 100);
    });

    sessionsBackBtn.addEventListener('click', closeSessionsMenu);


    const chatsList = document.querySelector(".chats-list");
    chatsList.addEventListener('scroll', () => {
        if (allChatsLoaded) return;
        if (chatsList.scrollTop + chatsList.clientHeight >= chatsList.scrollHeight - 10) {
            loadChats();
        }
    });
}

function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    const overlay = document.getElementById('menuOverlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

async function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        const res = await fetch('/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) {
            alert('Ошибка выхода');
            console.error('Error logging out:', await res.text());
            return;
        }
        location.reload();
    }
}


function openAboutMenu() {
    const aboutMenu = document.getElementById('aboutMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    aboutMenu.classList.add('active');
    menuOverlay.classList.add('active');
}

function closeAboutMenu() {
    const aboutMenu = document.getElementById('aboutMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    aboutMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}


function openSessionsMenu() {
    const sessionsMenu = document.getElementById('sessionsMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    sessionsMenu.classList.add('active');
    menuOverlay.classList.add('active');
    loadSessions();
}

function closeSessionsMenu() {
    const sessionsMenu = document.getElementById('sessionsMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    sessionsMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

async function loadSessions() {
    const sessionsList = document.getElementById('sessionsList');
    sessionsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--gray-text);">Загрузка...</div>';

    try {
        const res = await fetch('/auth/me', {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to load sessions');
        }

        const data = await res.json();
        const sessions = data.sessions;

        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="no-sessions">
                    <div class="no-sessions-icon">📱</div>
                    <div class="no-sessions-text">Нет активных сессий</div>
                </div>
            `;
            return;
        }

        sessionsList.innerHTML = '';

        const currentSessionId = getCurrentSessionId();

        sessions.forEach(session => {
            const sessionItem = createSessionItem(session, currentSessionId);
            sessionsList.appendChild(sessionItem);
        });

    } catch (error) {
        console.error('Error loading sessions:', error);
        sessionsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ef4444;">
                Error loading sessions
            </div>
        `;
    }
}

function getCurrentSessionId() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session_id') {
            return value;
        }
    }
    return null;
}

function createSessionItem(session, currentSessionId) {
    const div = document.createElement('div');
    const isCurrent = session.session_id === currentSessionId;
    div.className = `session-item${isCurrent ? ' current' : ''}`;

    const deviceIcon = getDeviceIcon(session.fingerprint);
    const deviceName = parseUserAgent(session.fingerprint);
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
            </div>
        ` : ''}
    `;

    if (!isCurrent) {
        const terminateBtn = div.querySelector('.session-terminate-btn');
        terminateBtn.addEventListener('click', () => {
            terminateSession(session.session_id);
        });
    }

    return div;
}

function getDeviceIcon(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return '📱';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return '📱';
    } else {
        return '💻';
    }
}

function parseUserAgent(userAgent) {
    let browser = 'unknown browser';
    let os = 'unknown OS';

    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) {
        const match = userAgent.match(/Mac OS X ([\d_]+)/);
        os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
    }
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) {
        const match = userAgent.match(/Android ([\d.]+)/);
        os = match ? `Android ${match[1]}` : 'Android';
    }
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) {
        const match = userAgent.match(/OS ([\d_]+)/);
        os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
    }

    return { browser, os };
}

function formatExpiryDate(date) {
    const now = new Date();
    const diff = date - now;

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (diff < 0) return 'Expired';
    if (days > 30) return `in ${Math.floor(days / 30)} мес`;
    if (days > 0) return `  in ${days} д`;
    if (hours > 0) return ` in ${hours} ч`;
    return 'менее часа';
}

async function terminateSession(sessionId) {
    if (!confirm('are you sure you want to terminate this session?')) {
        return;
    }

    try {
        const res = await fetch(`/auth/internal/session/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to terminate session');
        }

        loadSessions();

    } catch (error) {
        console.error('Error terminating session:', error);
        alert('Error terminating session');
    }
}


async function loadChats() {
    if (allChatsLoaded) return;

    try {
        const res = await fetch(`/chat/chats?value_from=${offset}&value_to=${offset + PAGE_SIZE}`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            console.error("Error loading chats", await res.text());
            return;
        }

        const chats = await res.json();
        if (chats.length === 0) {
            allChatsLoaded = true;
            return;
        }

        offset += chats.length;

        const chatsList = document.querySelector(".chats-list");

        chats.forEach(chat => {
            const other = chat.recipients[0];
            const div = document.createElement("div");
            div.className = "chat-item";
            div.dataset.chatId = chat.id;
            div.innerHTML = `
                <div class="avatar">${other.username[0].toUpperCase()}</div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">${other.username}</span>
                        <span class="chat-time">${chat.last_message_at ? chat.last_message_at.slice(11,16) : ""}</span>
                    </div>
                    <div class="chat-preview">—</div>
                </div>
            `;
            chatsList.appendChild(div);

            div.addEventListener('click', () => {
                document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
                div.classList.add("active");
            });
        });

    } catch (e) {
        console.error("Error loading chats:", e);
    }
}