// ================================================================
//  data.js — БАЗА ДАННЫХ ДЛЯ ТРИ В РЯД
// ================================================================

// ---- ПРОСТЫЕ КЛЮЧИ ----
const STORAGE_KEY = 'match3Users';
const CURRENT_USER_KEY = 'match3CurrentUser';

// ---- ПОЛЬЗОВАТЕЛИ ----
function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
}

function saveUsers(u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch (e) { return null; }
}

function setCurrentUser(u) {
    if (u) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(CURRENT_USER_KEY);
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

// ---- СОЗДАНИЕ АККАУНТА ----
function createUser(username, gender) {
    const users = getUsers();
    if (users[username]) return { success: false, error: 'Это имя уже занято!' };
    if (username.length < 5) return { success: false, error: 'Имя должно быть от 5 символов!' };
    users[username] = {
        gender: gender,
        highScore: 0,
        gamesPlayed: 0,
        created: Date.now()
    };
    saveUsers(users);
    return { success: true };
}

function loginUser(username) {
    const users = getUsers();
    if (!users[username]) return { success: false, error: 'Пользователь не найден!' };
    setCurrentUser(username);
    return { success: true };
}

function logoutUser() { setCurrentUser(null); }

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
console.log('🔑 Ключ пользователей:', STORAGE_KEY);
