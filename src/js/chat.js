 import { verifyToken } from './verifytoken.js';

window.addEventListener('DOMContentLoaded', async () => {

    const res = await verifyToken();
    if (!res) {
        window.location.replace("/");
        return;
    }

    initMessenger();
});

function initMessenger() {

    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const logoutBtn = document.getElementById('logoutBtn');

    const chatItems = document.querySelectorAll('.chat-item');

    const messageInput = document.querySelector('.message-input');
    const sendBtn = document.querySelector('.send-btn');
    const messagesContainer = document.querySelector('.messages-container');

    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);
    logoutBtn.addEventListener('click', logout);

    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            chatItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    sendBtn.addEventListener('click', () => sendMessage(messageInput, messagesContainer));
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(messageInput, messagesContainer);
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
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            alert('Ошибка выхода');
            return;
        }
        location.reload();
    }
}

function sendMessage(input, container) {
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message outgoing';
    messageDiv.innerHTML = `
        <div class="message-avatar">test</div>
        <div class="message-content">
            <div class="message-text">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    container.appendChild(messageDiv);
    input.value = '';
    container.scrollTop = container.scrollHeight;
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}