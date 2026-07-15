// ================================================================
//  data.js — БАЗА ДАННЫХ (С АВТО-ВХОДОМ)
// ================================================================

const STORAGE_KEY = 'match3Users';
const CURRENT_USER_KEY = 'match3CurrentUser';

// ---- ПОЛЬЗОВАТЕЛИ ----
function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
}

function saveUsers(u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }

// ---- ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ (СОХРАНЯЕТСЯ В localStorage) ----
function getCurrentUser() {
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        if (!user) return null;
        const parsed = JSON.parse(user);
        // Проверяем, существует ли пользователь в базе
        const users = getUsers();
        if (users[parsed]) {
            return parsed;
        }
        // Если пользователь удалён из базы — очищаем
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
    } catch (e) { return null; }
}

function setCurrentUser(u) {
    if (u) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
        console.log('👤 Сохранён пользователь:', u);
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        console.log('👤 Пользователь удалён');
    }
}

// ---- ПРОВЕРКА АВТОРИЗАЦИИ (ВЫЗЫВАЕТСЯ ПРИ ЗАГРУЗКЕ) ----
function checkAuth() {
    const user = getCurrentUser();
    if (user) {
        const users = getUsers();
        if (users[user]) {
            console.log('✅ Авто-вход выполнен для:', user);
            return user;
        }
    }
    console.log('❌ Авто-вход не выполнен');
    return null;
}

// ---- ОСТАЛЬНЫЕ ФУНКЦИИ ----
function getUserData(username) {
    const users = getUsers();
    return users[username] || null;
}

function saveUserData(username, data) {
    const users = getUsers();
    users[username] = data;
    saveUsers(users);
}

function createUser(username, gender) {
    const users = getUsers();
    if (users[username]) return { success: false, error: 'Это имя уже занято!' };
    if (username.length < 5) return { success: false, error: 'Имя должно быть от 5 символов!' };
    users[username] = {
        gender: gender,
        highScore: 0,
        gamesPlayed: 0,
        menuState: {
            currentLevel: 1,
            maxLevel: 5,
            stars: 0,
            energy: 5,
            maxEnergy: 5,
            hintCount: 3,
            lastEnergyTime: Date.now(),
            lastDailyReward: Date.now() - 86400000,
        },
        created: Date.now()
    };
    saveUsers(users);
    // Автоматически входим
    setCurrentUser(username);
    return { success: true };
}

function loginUser(username) {
    const users = getUsers();
    if (!users[username]) return { success: false, error: 'Пользователь не найден!' };
    setCurrentUser(username);
    return { success: true };
}

function logoutUser() {
    setCurrentUser(null);
}

function getHighScore(username) {
    const user = getUserData(username);
    if (!user) return 0;
    return user.highScore || 0;
}

function saveHighScore(username, score) {
    const user = getUserData(username);
    if (!user) return;
    user.highScore = score;
    saveUserData(username, user);
}

console.log('📦 data.js загружен!');
console.log('🔑 Текущий пользователь:', getCurrentUser());
