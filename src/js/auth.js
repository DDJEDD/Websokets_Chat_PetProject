import {permit} from './tools.js';
import { verifyToken } from './verifytoken.js';

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

// Show success message
function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}

export async function login() {
  try {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Please fill in all fields');
      return;
    }

    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: username,
        password: password
      })
    });

    if (!res.ok) {
      let errorMessage = 'Login failed. Please check your credentials.';

      try {
        const errorData = await res.json();

        // Handle Pydantic validation errors (422)
        if (res.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors format
            const errors = errorData.detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'Field';
                return `${field}: ${err.msg}`;
              }
              return String(err);
            }).join('; ');
            errorMessage = errors || 'Validation failed';
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
        // Handle other error formats
        else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            if (errorData.detail.includes('verify failed') || errorData.detail.includes('Login verify failed')) {
              errorMessage = 'Invalid username or password';
            } else if (errorData.detail.includes('not found')) {
              errorMessage = 'User not found';
            } else {
              errorMessage = errorData.detail;
            }
          }
        }
      } catch (e) {
        // If response is not JSON, try text
        try {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // Use default error message
        }
      }

      showError(errorMessage);
      return;
    }

    showSuccess('Login successful! Redirecting...');
    setTimeout(() => {
      permit(res);
    }, 1000);

  } catch (e) {
    console.error(e);
    showError('Connection error. Please try again.');
  }
}

export async function register() {
  try {
    const username = document.getElementById('username').value;
    const login = document.getElementById('login').value;
    const p1 = document.getElementById('password').value;
    const p2 = document.getElementById('password2').value;

    // Validation
    if (!login || !username || !p1 || !p2) {
      showError('Please fill in all fields');
      return;
    }

    if (p1 !== p2) {
      showError('Passwords do not match');
      return;
    }

    if (p1.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        login: login,
        username: username,
        password: p1
      })
    });

    if (!res.ok) {
      let errorMessage = 'Registration failed. Please try again.';

      try {
        const errorData = await res.json();

        // Handle Pydantic validation errors (422)
        if (res.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors format
            const errors = errorData.detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'Field';
                return `${field}: ${err.msg}`;
              }
              return String(err);
            }).join('; ');
            errorMessage = errors || 'Validation failed';
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
        // Handle other error formats
        else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            if (errorData.detail.includes('already exists') || errorData.detail.includes('duplicate')) {
              errorMessage = 'This username or login is already taken';
            } else if (errorData.detail.includes('invalid')) {
              errorMessage = 'Invalid input. Please check your information.';
            } else {
              errorMessage = errorData.detail;
            }
          }
        }
      } catch (e) {
        // If response is not JSON, try text
        try {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // Use default error message
        }
      }

      showError(errorMessage);
      return;
    }

    showSuccess('Account created successfully! Redirecting...');
    setTimeout(() => {
      window.location.replace("/");
    }, 1500);

  } catch (e) {
    console.error(e);
    showError('Connection error. Please try again.');
  }
}