import { showAlert } from './uiHelpers.js';
const USERS_KEY = 'hrm_users';
const SESSION_KEY = 'hrm_session';
const SESSION_TTL_MS = 60 * 60 * 1000;
const simpleHash = (password) => {
    return `hashed_${password}_secret`;
};
const initAdmin = () => {
    if (!localStorage.getItem(USERS_KEY)) {
        const adminUser = { username: 'admin', password: simpleHash('admin123') };
        localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
    }
};
initAdmin();
const checkCredentials = async (username, password) => {
    const delay = 1000 + Math.floor(Math.random() * 1000);
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            const user = users.find(
                (u) => u.username === username && u.password === simpleHash(password)
            );
            resolve(!!user);
        }, delay);
    });
};
export const login = async (username, password) => {
    const isValid = await checkCredentials(username, password);
    if (isValid) {
        const now = Date.now();
        const session = {
            user: username,
            expiry: now + SESSION_TTL_MS,
            issuedAt: now,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    }
    return false;
};
export const logout = () => {
    localStorage.removeItem(SESSION_KEY);
};
export const isAuthenticated = () => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const session = JSON.parse(raw);
        if (!session || typeof session.expiry !== 'number') {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        if (Date.now() > session.expiry) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        return true;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return false;
    }
};
export const renderLogin = (container, onLoginSuccess, onShowRegister) => {
    container.innerHTML = `
        <div class="form-container">
            <h2>Đăng nhập HRM</h2>
            <form id="login-form">
                <div class="form-group">
                    <label for="username">Tên đăng nhập</label>
                    <input type="text" id="username" placeholder="Tài khoản" required>
                </div>
                <div class="form-group">
                    <label for="password">Mật khẩu</label>
                    <input type="password" id="password" placeholder="Mật khẩu" required>
                </div>
                <div class="form-actions">
                    <button type="submit">Đăng nhập</button>
                    <button type="button" id="show-register" class="secondary">Đăng ký</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = e.target.querySelector('button');
        loginBtn.textContent = 'Đang xử lý...';
        loginBtn.disabled = true;
        const success = await login(username, password);
        if (success) {
            onLoginSuccess();
        } else {
            showAlert('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
            loginBtn.textContent = 'Đăng nhập';
            loginBtn.disabled = false;
        }
    });
    const regBtn = document.getElementById('show-register');
    if (regBtn) {
        regBtn.addEventListener('click', () => {
            if (typeof onShowRegister === 'function') {
                onShowRegister();
            }
        });
    }
};