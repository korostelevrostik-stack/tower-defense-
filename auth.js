// ================================================================
//  auth.js — ПРОСТАЯ ВЕРСИЯ (БЕЗ ОШИБОК)
// ================================================================

// ---- ГЕНЕРАЦИЯ ИМЕНИ ----
function generateRandomName() {
    const prefixes = ['Весёлый', 'Храбрый', 'Мудрый', 'Быстрый', 'Сильный', 'Смелый', 'Добрый', 'Светлый', 'Тёмный', 'Золотой'];
    const roots = ['Петух', 'Волк', 'Лис', 'Орёл', 'Сокол', 'Тигр', 'Лев', 'Медведь', 'Дракон', 'Феникс'];
    const suffixes = ['на закате', 'в рассвете', 'в тумане', 'в грозе', 'в буре', 'в ночи', 'в дне', 'в тени', 'в свете', 'в пламени'];
    const first = prefixes[Math.floor(Math.random() * prefixes.length)];
    const second = roots[Math.floor(Math.random() * roots.length)];
    const third = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${first} ${second} ${third}`;
}

// ---- УНИКАЛЬНОЕ ИМЯ ----
function generateUniqueName() {
    const users = getUsers();
    let name;
    let attempts = 0;
    do {
        name = generateRandomName();
        attempts++;
    } while (users[name] && attempts < 100);
    return name;
}

// ---- АВТО-РЕГИСТРАЦИЯ ----
function autoRegister() {
    const name = generateUniqueName();
    const users = getUsers();
    users[name] = {
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
    setCurrentUser(name);
    return name;
}

// ---- ВХОД ----
function loginOrRegister() {
    const users = getUsers();
    const savedUser = getCurrentUser();
    if (savedUser && users[savedUser]) return savedUser;
    
    const userList = Object.keys(users);
    if (userList.length > 0) {
        const randomUser = userList[Math.floor(Math.random() * userList.length)];
        setCurrentUser(randomUser);
        return randomUser;
    }
    return autoRegister();
}

function getOrCreateUser() {
    const user = getCurrentUser();
    if (user) {
        const users = getUsers();
        if (users[user]) return user;
    }
    return loginOrRegister();
}

// ---- ПОКАЗ ЭКРАНА ВХОДА ----
function showAuthScreen() {
    document.getElementById('authOverlay').classList.add('hidden');
    const user = getOrCreateUser();
    document.getElementById('userNameDisplay').textContent = user;
    document.getElementById('userName').textContent = user;
    document.getElementById('menuContainer').style.display = 'flex';
    if (typeof loadMenu === 'function') loadMenu();
    if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
    if (typeof showToast === 'function') showToast(`👋 Привет, ${user}!`, false);
}

// ---- ОБРАБОТЧИКИ ----
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('authSubmitBtn');
    const toggle = document.getElementById('authToggle');
    if (btn) btn.addEventListener('click', showAuthScreen);
    if (toggle) toggle.addEventListener('click', showAuthScreen);
});

console.log('🔐 auth.js (простая версия) загружен!');
