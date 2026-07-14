// ================================================================
//  auth.js — СИСТЕМА РЕГИСТРАЦИИ И ВХОДА
// ================================================================

let currentUser = null;

function showAuthScreen(mode) {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('hidden');
    document.getElementById('authError').textContent = '';
    document.getElementById('authSuccess').textContent = '';

    if (mode === 'login') {
        document.getElementById('authTitle').textContent = '🏰 Вход в игру';
        document.getElementById('authSubmitBtn').textContent = 'Войти';
        document.getElementById('authSubmitBtn').className = 'auth-btn-login';
        document.getElementById('authToggle').textContent = 'Нет аккаунта? Регистрация';
        document.getElementById('authToggle').dataset.mode = 'register';
        document.getElementById('authExtraFields').innerHTML = '';
    } else {
        document.getElementById('authTitle').textContent = '🏰 Создание профиля';
        document.getElementById('authSubmitBtn').textContent = 'Создать аккаунт';
        document.getElementById('authSubmitBtn').className = 'auth-btn-register';
        document.getElementById('authToggle').textContent = 'Уже есть аккаунт? Войти';
        document.getElementById('authToggle').dataset.mode = 'login';
        document.getElementById('authExtraFields').innerHTML = `
            <div class="auth-label">👤 Ты кто?</div>
            <div class="gender-row">
                <button class="gender-btn" data-gender="male">👦 Мальчик</button>
                <button class="gender-btn" data-gender="female">👧 Девочка</button>
            </div>
            <div class="auth-label">👤 Придумай имя (от 5 символов)</div>
            <input type="text" id="authName" placeholder="Например: ВоинСвета" maxlength="20">
        `;
        // Обработчики выбора пола
        setTimeout(() => {
            document.querySelectorAll('.gender-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }, 100);
    }
}

function handleAuth() {
    const isRegister = document.getElementById('authSubmitBtn').textContent === 'Создать аккаунт';
    const err = document.getElementById('authError');
    const suc = document.getElementById('authSuccess');
    err.textContent = '';
    suc.textContent = '';

    if (isRegister) {
        // РЕГИСТРАЦИЯ
        const name = document.getElementById('authName').value.trim();
        const genderBtn = document.querySelector('.gender-btn.active');
        if (!genderBtn) {
            err.textContent = 'Выбери свой пол!';
            return;
        }
        const gender = genderBtn.dataset.gender;
        if (name.length < 5) {
            err.textContent = '⚠️ Имя должно быть от 5 символов!';
            return;
        }
        if (name.length > 20) {
            err.textContent = '⚠️ Имя слишком длинное!';
            return;
        }
        // Проверяем, есть ли такой пользователь
        const users = getUsers();
        if (users[name]) {
            err.textContent = '❌ Это имя уже занято!';
            return;
        }
        // Создаём аккаунт
        const result = createUser(name, gender);
        if (result.success) {
            suc.textContent = '✅ Аккаунт создан!';
            setTimeout(() => {
                loginUser(name);
                document.getElementById('authOverlay').classList.add('hidden');
                currentUser = name;
                if (typeof startGame === 'function') startGame();
            }, 500);
        } else {
            err.textContent = result.error;
        }
    } else {
        // ВХОД
        const name = document.getElementById('authLogin').value.trim();
        if (!name) {
            err.textContent = 'Введи своё имя!';
            return;
        }
        const users = getUsers();
        if (!users[name]) {
            err.textContent = '❌ Пользователь не найден!';
            return;
        }
        suc.textContent = '✅ Добро пожаловать!';
        setTimeout(() => {
            loginUser(name);
            document.getElementById('authOverlay').classList.add('hidden');
            currentUser = name;
            if (typeof startGame === 'function') startGame();
        }, 500);
    }
}

// ---- СОБЫТИЯ ----
document.getElementById('authSubmitBtn').addEventListener('click', handleAuth);

document.getElementById('authToggle').addEventListener('click', function() {
    showAuthScreen(this.dataset.mode);
});

// ---- ВЫХОД ----
function logoutUserAction() {
    if (confirm('Выйти из аккаунта?')) {
        logoutUser();
        currentUser = null;
        document.getElementById('authOverlay').classList.remove('hidden');
        showAuthScreen('login');
        if (typeof stopGame === 'function') stopGame();
    }
}

document.getElementById('backBtn').addEventListener('click', logoutUserAction);

console.log('🔐 auth.js загружен!');