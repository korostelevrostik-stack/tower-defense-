// ================================================================
//  menu.js — ИНТЕРФЕЙС КАК В GARDENSCAPES
// ================================================================

// ---- СОСТОЯНИЕ МЕНЮ ----
let menuState = {
    currentLevel: 1,
    maxLevel: 5,
    stars: 0,
    energy: 5,
    maxEnergy: 5,
    energyTimer: null,
    lastEnergyTime: Date.now(),
    dailyReward: false,
    lastDailyReward: Date.now(),
    hintCount: 3,
};

// ---- ЗАГРУЗКА МЕНЮ ----
function loadMenu() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('menuContainer').style.display = 'none';
        showAuthScreen('login');
        return;
    }
    document.getElementById('menuContainer').style.display = 'block';
    
    // Загружаем данные пользователя
    const userData = getUserData(user);
    if (userData && userData.menuState) {
        menuState = { ...menuState, ...userData.menuState };
    }
    
    updateMenuUI();
    startEnergyRegeneration();
    updateLevelDisplay();
}

// ---- ОБНОВЛЕНИЕ UI МЕНЮ ----
function updateMenuUI() {
    document.getElementById('userNameDisplay').textContent = getCurrentUser() || 'Гость';
    document.getElementById('energyCount').textContent = menuState.energy;
    document.getElementById('levelDisplay').textContent = `Уровень ${menuState.currentLevel}`;
    document.getElementById('levelProgress').style.width = `${(menuState.currentLevel / menuState.maxLevel) * 100}%`;
    document.getElementById('starsCount').textContent = '⭐'.repeat(menuState.stars) || '☆';
    document.getElementById('hintCount').textContent = menuState.hintCount;
    
    // Обновляем состояние кнопок
    document.getElementById('playBtn').textContent = `🎮 Играть (Уровень ${menuState.currentLevel})`;
}

// ---- УРОВНИ И ПРОГРЕСС ----
function updateLevelDisplay() {
    const levels = document.getElementById('levelsContainer');
    levels.innerHTML = '';
    for (let i = 1; i <= menuState.maxLevel; i++) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-item' + (i <= menuState.currentLevel ? ' unlocked' : ' locked');
        levelDiv.textContent = i;
        if (i === menuState.currentLevel) levelDiv.classList.add('active');
        if (i < menuState.currentLevel) {
            levelDiv.innerHTML = `${i} ✅`;
        } else if (i === menuState.currentLevel) {
            levelDiv.innerHTML = `${i} 🎯`;
        } else {
            levelDiv.innerHTML = `${i} 🔒`;
        }
        levels.appendChild(levelDiv);
    }
}

// ---- ЭНЕРГИЯ (КАК В HOMESCAPES) ----
function startEnergyRegeneration() {
    if (menuState.energyTimer) clearInterval(menuState.energyTimer);
    menuState.energyTimer = setInterval(() => {
        const now = Date.now();
        const diff = (now - menuState.lastEnergyTime) / 60000; // минуты
        if (diff >= 5 && menuState.energy < menuState.maxEnergy) {
            menuState.energy = Math.min(menuState.maxEnergy, menuState.energy + 1);
            menuState.lastEnergyTime = now;
            updateMenuUI();
            saveMenuState();
        }
    }, 10000);
}

function useEnergy() {
    if (menuState.energy <= 0) {
        showToast('⚠️ Нет энергии! Подожди 5 минут.', true);
        return false;
    }
    menuState.energy--;
    updateMenuUI();
    saveMenuState();
    return true;
}

// ---- ПОДСКАЗКИ (КАК В FISHDOM) ----
function useHint() {
    if (menuState.hintCount <= 0) {
        showToast('⚠️ Нет подсказок!', true);
        return false;
    }
    menuState.hintCount--;
    updateMenuUI();
    saveMenuState();
    showHintOnBoard();
    return true;
}

function showHintOnBoard() {
    // Находим первую возможную комбинацию и подсвечиваем
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (typeof grid[i][j] !== 'number') continue;
            const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
            for (let [di, dj] of neighbors) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < SIZE && nj >= 0 && nj < SIZE) {
                    if (typeof grid[ni][nj] !== 'number') continue;
                    const temp = grid[i][j];
                    grid[i][j] = grid[ni][nj];
                    grid[ni][nj] = temp;
                    if (hasMatches()) {
                        grid[ni][nj] = grid[i][j];
                        grid[i][j] = temp;
                        // Подсвечиваем
                        const cell = getCellElement(i, j);
                        if (cell) {
                            cell.classList.add('hint');
                            setTimeout(() => cell.classList.remove('hint'), 2000);
                        }
                        const cell2 = getCellElement(ni, nj);
                        if (cell2) {
                            cell2.classList.add('hint');
                            setTimeout(() => cell2.classList.remove('hint'), 2000);
                        }
                        return;
                    }
                    grid[ni][nj] = grid[i][j];
                    grid[i][j] = temp;
                }
            }
        }
    }
    showToast('🔍 Нет доступных ходов!', true);
}

// ---- ЕЖЕДНЕВНАЯ НАГРАДА (КАК В FISHDOM) ----
function claimDailyReward() {
    const now = Date.now();
    const diff = (now - menuState.lastDailyReward) / 86400000; // дни
    if (diff < 1) {
        showToast('🎁 Ежедневная награда уже получена! Жди завтра.', true);
        return;
    }
    const reward = 5 + Math.floor(Math.random() * 10);
    score += reward;
    menuState.lastDailyReward = now;
    menuState.dailyReward = true;
    saveMenuState();
    updateMenuUI();
    showToast(`🎁 +${reward} монет за ежедневный вход!`, false);
}

// ---- СОХРАНЕНИЕ СОСТОЯНИЯ МЕНЮ ----
function saveMenuState() {
    const user = getCurrentUser();
    if (!user) return;
    const userData = getUserData(user);
    if (!userData) return;
    userData.menuState = { ...menuState };
    saveUserData(user, userData);
}

// ---- УРОВНИ (УСЛОЖНЕНИЕ) ----
function getLevelConfig(level) {
    // Чем выше уровень, тем больше размер поля и сложнее
    const configs = {
        1: { size: 8, types: 5, moves: 20 },
        2: { size: 8, types: 6, moves: 22 },
        3: { size: 8, types: 6, moves: 25 },
        4: { size: 8, types: 7, moves: 28 },
        5: { size: 8, types: 7, moves: 30 },
    };
    return configs[level] || configs[1];
}

// ---- НАЧАЛО ИГРЫ С МЕНЮ ----
function startGameFromMenu() {
    if (!useEnergy()) return;
    if (menuState.currentLevel > menuState.maxLevel) {
        showToast('🎉 Все уровни пройдены!', false);
        return;
    }
    startGame();
}

// ---- КНОПКИ МЕНЮ ----
document.getElementById('playBtn').addEventListener('click', startGameFromMenu);
document.getElementById('hintBtn').addEventListener('click', useHint);
document.getElementById('dailyBtn').addEventListener('click', claimDailyReward);
document.getElementById('resetMenuBtn').addEventListener('click', () => {
    if (confirm('Сбросить весь прогресс?')) {
        menuState.currentLevel = 1;
        menuState.stars = 0;
        menuState.energy = menuState.maxEnergy;
        menuState.hintCount = 3;
        saveMenuState();
        updateMenuUI();
        showToast('🔄 Прогресс сброшен!', false);
    }
});

console.log('🏡 menu.js загружен!');
