import {permit} from './tools.js';
import { verifyToken } from './verifytoken.js';
export async function login() {
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
      console.log(await res.text());
      return;
    }
    permit(res);
  } catch (e) {
    console.log(e);
  }

}

export async function register() {

      const username = document.getElementById('username').value;
      const p1 = document.getElementById('password').value;
      const p2 = document.getElementById('password2').value;

      if (p1 !== p2) {
        console.log("password do not match");
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
          console.log(await res.text());
          return;
        }
        window.location.replace("/");

      } catch (e) {
        console.log(e);
      }

    }