// ================================================================
//  data.js — БАЗА ДАННЫХ (КАК В КЛИКЕРЕ)
// ================================================================

const STORAGE_KEY = 'match3Users';
const CURRENT_USER_KEY = 'match3CurrentUser';

function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
}

function saveUsers(u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }

function getCurrentUser() {
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        if (!user) return null;
        const parsed = JSON.parse(user);
        const users = getUsers();
        if (users[parsed]) return parsed;
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

function checkAuth() {
    const user = getCurrentUser();
    if (user) {
        const users = getUsers();
        if (users[user]) {
            console.log('✅ Авто-вход для:', user);
            return user;
        }
    }
    return null;
}

function getUserData(username) {
    const users = getUsers();
    return users[username] || null;
}

function saveUserData(username, data) {
    const users = getUsers();
    users[username] = data;
    saveUsers(users);
}

// ---- СОЗДАНИЕ АККАУНТА (КАК В КЛИКЕРЕ) ----
function createAccount(username, password) {
    const users = getUsers();
    if (users[username]) return { success: false, error: 'Это имя уже занято!' };
    if (username.length < 2) return { success: false, error: 'Имя слишком короткое!' };
    if (password.length < 1) return { success: false, error: 'Введите пароль!' };
    
    users[username] = {
        password: password,
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
    setCurrentUser(username);
    return { success: true };
}

function loginUser(username, password) {
    const users = getUsers();
    if (!users[username]) return { success: false, error: 'Пользователь не найден!' };
    if (users[username].password !== password) return { success: false, error: 'Неверный пароль!' };
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
