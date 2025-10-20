import { showAlert } from './uiHelpers.js';
const USERS_KEY = 'hrm_users';
const simpleHash = (password) => `hashed_${password}_secret`;
const readUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
};
const writeUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};
const usernameExists = (username) => {
    const users = readUsers();
    const uname = username.trim().toLowerCase();
    return users.some((u) => (u.username || '').trim().toLowerCase() === uname);
};
export const render = (container, onRegistered) => {
    container.innerHTML = `
		<div class="form-container">
            <button id="register-back-btn" class="secondary" title="Quay lại đăng nhập">←</button>
			<h2>Đăng ký tài khoản</h2>
			<form id="register-form">
				<div class="form-group">
					<label for="reg-username">Tên đăng nhập</label>
					<input type="text" id="reg-username" placeholder="Nhập tên đăng nhập" required>
				</div>
				<div class="form-group">
					<label for="reg-password">Mật khẩu</label>
					<input type="password" id="reg-password" placeholder="Tối thiểu 6 ký tự" required minlength="6">
				</div>
				<div class="form-group">
					<label for="reg-confirm">Xác nhận mật khẩu</label>
					<input type="password" id="reg-confirm" placeholder="Nhập lại mật khẩu" required minlength="6">
				</div>
				<button type="submit">Đăng ký</button>
			</form>
		</div>
	`;
    const form = container.querySelector('#register-form');
    const backBtn = container.querySelector('#register-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof onRegistered === 'function') {
                onRegistered();
            }
        });
    }
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = container.querySelector('#reg-username').value.trim();
        const password = container.querySelector('#reg-password').value;
        const confirm = container.querySelector('#reg-confirm').value;
        if (!username || !password || !confirm) {
            showAlert('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }
        if (password.length < 6) {
            showAlert('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }
        if (password !== confirm) {
            showAlert('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        if (usernameExists(username)) {
            showAlert('Tên đăng nhập đã tồn tại', 'error');
            return;
        }
        const users = readUsers();
        users.push({ username, password: simpleHash(password) });
        writeUsers(users);
        showAlert('Đăng ký thành công. Vui lòng đăng nhập.');
        if (typeof onRegistered === 'function') {
            onRegistered();
        } else {
            form.reset();
        }
    });
};

