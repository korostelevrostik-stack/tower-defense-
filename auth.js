// ================================================================
//  auth.js — РЕГИСТРАЦИЯ И ВХОД (КАК В КЛИКЕРЕ)
// ================================================================

function showAuthScreen(mode) {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('hidden');
    document.getElementById('authError').textContent = '';
    document.getElementById('authSuccess').textContent = '';
    document.getElementById('authLogin').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authExtraFields').innerHTML = '';

    if (mode === 'login') {
        document.getElementById('authTitle').textContent = '🍎 Вход в игру';
        document.getElementById('authSubmitBtn').textContent = 'Войти';
        document.getElementById('authSubmitBtn').className = 'auth-btn-login';
        document.getElementById('authToggle').textContent = 'Нет аккаунта? Регистрация';
        document.getElementById('authToggle').dataset.mode = 'register';
        document.getElementById('authExtraFields').innerHTML = '';
    } else {
        document.getElementById('authTitle').textContent = '🍎 Регистрация';
        document.getElementById('authSubmitBtn').textContent = 'Создать аккаунт';
        document.getElementById('authSubmitBtn').className = 'auth-btn-register';
        document.getElementById('authToggle').textContent = 'Уже есть аккаунт? Войти';
        document.getElementById('authToggle').dataset.mode = 'login';
        document.getElementById('authExtraFields').innerHTML = `
            <input type="password" id="authPassword2" placeholder="🔒 Повторите пароль">
        `;
    }
}

function handleAuth() {
    const login = document.getElementById('authLogin').value.trim();
    const pass = document.getElementById('authPassword').value.trim();
    const err = document.getElementById('authError');
    const suc = document.getElementById('authSuccess');
    err.textContent = '';
    suc.textContent = '';

    if (!login || !pass) {
        err.textContent = 'Заполните все поля!';
        return;
    }

    const isRegister = document.getElementById('authSubmitBtn').textContent === 'Создать аккаунт';
    const users = getUsers();

    if (isRegister) {
        const pass2 = document.getElementById('authPassword2').value.trim();
        if (pass !== pass2) {
            err.textContent = 'Пароли не совпадают!';
            return;
        }
        if (users[login]) {
            err.textContent = '❌ Это имя уже занято!';
            return;
        }
        const result = createAccount(login, pass);
        if (result.success) {
            suc.textContent = '✅ Аккаунт создан!';
            setTimeout(() => {
                document.getElementById('authOverlay').classList.add('hidden');
                document.getElementById('userNameDisplay').textContent = login;
                document.getElementById('userName').textContent = login;
                document.getElementById('menuContainer').style.display = 'block';
                loadMenu();
                updateLevelDisplay();
                showToast(`👋 Добро пожаловать, ${login}!`, false);
            }, 500);
        } else {
            err.textContent = result.error;
        }
    } else {
        const result = loginUser(login, pass);
        if (result.success) {
            suc.textContent = '✅ Добро пожаловать!';
            setTimeout(() => {
                document.getElementById('authOverlay').classList.add('hidden');
                document.getElementById('userNameDisplay').textContent = login;
                document.getElementById('userName').textContent = login;
                document.getElementById('menuContainer').style.display = 'block';
                loadMenu();
                updateLevelDisplay();
                showToast(`👋 С возвращением, ${login}!`, false);
            }, 500);
        } else {
            err.textContent = result.error;
        }
    }
}

document.getElementById('authSubmitBtn').addEventListener('click', handleAuth);

document.getElementById('authToggle').addEventListener('click', function() {
    showAuthScreen(this.dataset.mode);
});

document.getElementById('backBtn').addEventListener('click', () => {
    if (confirm('Выйти из аккаунта?')) {
        logoutUser();
        document.getElementById('authOverlay').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = 'Гость';
        document.getElementById('userName').textContent = 'Гость';
        document.getElementById('menuContainer').style.display = 'none';
        showAuthScreen('login');
    }
});

console.log('🔐 auth.js загружен!');
