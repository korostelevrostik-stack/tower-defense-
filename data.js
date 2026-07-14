// ================================================================
//  data.js — БАЗА ДАННЫХ (локальное хранилище)
// ================================================================

// ---- ПОЛЬЗОВАТЕЛИ ----
function getUsers() {
    try { return JSON.parse(localStorage.getItem('towerUsers')) || {}; } catch (e) { return {}; }
}

function saveUsers(u) { localStorage.setItem('towerUsers', JSON.stringify(u)); }

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('towerCurrentUser')); } catch (e) { return null; }
}

function setCurrentUser(u) {
    if (u) localStorage.setItem('towerCurrentUser', JSON.stringify(u));
    else localStorage.removeItem('towerCurrentUser');
}

// ---- ПОЛЬЗОВАТЕЛЬ ----
function getUserData(username) {
    const users = getUsers();
    return users[username] || null;
}

function saveUserData(username, data) {
    const users = getUsers();
    users[username] = data;
    saveUsers(users);
}

function createUser(username, gender, password = '') {
    const users = getUsers();
    if (users[username]) return { success: false, error: 'Это имя уже занято!' };
    if (username.length < 5) return { success: false, error: 'Имя должно быть от 5 символов!' };

    users[username] = {
        gender: gender,
        password: password,
        state: {
            money: 50,
            maxWaves: 0,
            totalKills: 0,
            gamesPlayed: 0,
        },
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

function logoutUser() {
    setCurrentUser(null);
}

// ---- СОСТОЯНИЕ ИГРЫ ----
function getGameState(username) {
    const user = getUserData(username);
    if (!user) return null;
    return user.state || { money: 50, maxWaves: 0, totalKills: 0, gamesPlayed: 0 };
}

function saveGameState(username, state) {
    const user = getUserData(username);
    if (!user) return;
    user.state = { ...user.state, ...state };
    saveUserData(username, user);
}

console.log('📦 data.js загружен!');