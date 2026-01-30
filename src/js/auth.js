import {permit} from './tools.js';
import { verifyToken } from './verifytoken.js';
export async function login() {
  const status = document.getElementById('status');
  status.textContent = 'connecting...';
  status.className = 'status';
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: document.getElementById('username').value,
        password: document.getElementById('password').value
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'login failed');
    }
    permit(res, status);
  } catch (e) {
    status.textContent = e.message;
    status.classList.add('error');
  }

}

export async function register() {
      const status = document.getElementById('status');
      status.textContent = 'creating identity...';
      status.className = 'status';

      const username = document.getElementById('username').value;
      const p1 = document.getElementById('password').value;
      const p2 = document.getElementById('password2').value;

      if (p1 !== p2) {
        status.textContent = 'passwords do not match';
        status.classList.add('error');
        return;
      }

      try {
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({login:username, password: p1 })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'registration failed');
        }

        status.textContent = 'ACCOUNT CREATED';
        status.classList.add('success');
      } catch (e) {
        status.textContent = e.message;
        status.classList.add('error');
      }
    }