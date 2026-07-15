// ================================================================
//  game.js — ТРИ В РЯД (С УРОВНЯМИ И МЕХАНИКАМИ)
// ================================================================

let grid = [];
let SIZE = 8;
let EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑'];
let selected = null;
let score = 0;
let moves = 0;
let maxMoves = 20;
let isProcessing = false;
let currentUser = null;
let highScore = 0;
let comboCount = 0;
let levelTargets = [];
let levelCompleted = false;

const BONUS_TYPES = {
    ROCKET: 'rocket',
    BOMB: 'bomb'
};

// ---- НАСТРОЙКИ УРОВНЕЙ ----
function getLevelConfig(level) {
    const configs = {
        1: { size: 8, types: 5, moves: 20, target: 30 },
        2: { size: 8, types: 6, moves: 22, target: 40 },
        3: { size: 8, types: 6, moves: 25, target: 50 },
        4: { size: 8, types: 7, moves: 28, target: 60 },
        5: { size: 8, types: 7, moves: 30, target: 75 },
    };
    return configs[level] || configs[1];
}

function initGridForLevel(level) {
    const config = getLevelConfig(level);
    SIZE = config.size;
    EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑'].slice(0, config.types);
    maxMoves = config.moves;
    
    grid = [];
    for (let i = 0; i < SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < SIZE; j++) {
            grid[i][j] = Math.floor(Math.random() * EMOJIS.length);
        }
    }
    while (hasMatches()) {
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (isPartOfMatch(i, j)) {
                    grid[i][j] = Math.floor(Math.random() * EMOJIS.length);
                }
            }
        }
    }
}

function startGame() {
    const user = getCurrentUser();
    if (!user) {
        showAuthScreen('login');
        return;
    }
    currentUser = user;
    document.getElementById('userName').textContent = user;
    
    const level = menuState.currentLevel || 1;
    const config = getLevelConfig(level);
    
    highScore = getHighScore(user);
    score = 0;
    moves = 0;
    selected = null;
    isProcessing = false;
    comboCount = 0;
    levelCompleted = false;
    
    document.getElementById('score').textContent = '0';
    document.getElementById('moves').textContent = `0/${maxMoves}`;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameTitle').textContent = `🎮 Уровень ${level}`;
    document.getElementById('targetScore').textContent = `🎯 Цель: ${config.target} очков`;
    
    initGridForLevel(level);
    renderGrid();
    document.getElementById('statusMsg').textContent = '🍎 Собирай комбинации!';
    
    // Показываем игровой экран
    document.getElementById('menuContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameOver').classList.remove('active');
}

function checkLevelComplete() {
    const level = menuState.currentLevel || 1;
    const config = getLevelConfig(level);
    if (score >= config.target && !levelCompleted) {
        levelCompleted = true;
        menuState.currentLevel++;
        menuState.stars += Math.floor(score / config.target);
        saveMenuState();
        showToast(`🎉 Уровень ${level} пройден!`, false);
        setTimeout(() => {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('menuContainer').style.display = 'block';
            updateMenuUI();
            updateLevelDisplay();
        }, 2000);
        return true;
    }
    return false;
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = `${moves}/${maxMoves}`;
    document.getElementById('highScore').textContent = highScore;
    const user = getCurrentUser();
    if (user) document.getElementById('userName').textContent = user;
    
    const level = menuState.currentLevel || 1;
    const config = getLevelConfig(level);
    document.getElementById('targetScore').textContent = `🎯 Цель: ${config.target} очков`;
}

// ---- ЗАМЕНЯЕМ processMatches() ДЛЯ ПРОВЕРКИ УРОВНЕЙ ----
function processMatches() {
    const matches = getMatches();
    if (matches.length === 0) {
        isProcessing = false;
        selected = null;
        return;
    }

    comboCount++;
    let points = 0;
    let bonusMap = new Map();
    const cellsToRemove = new Set();

    matches.forEach(group => {
        const size = group.length;
        if (size >= 4) {
            const bonusType = size >= 5 ? BONUS_TYPES.BOMB : BONUS_TYPES.ROCKET;
            const mid = Math.floor(group.length / 2);
            const [r, c] = group[mid];
            bonusMap.set(`${r},${c}`, bonusType);
            group.forEach(([r, c]) => {
                if (!bonusMap.has(`${r},${c}`)) cellsToRemove.add(`${r},${c}`);
            });
        } else {
            group.forEach(([r, c]) => cellsToRemove.add(`${r},${c}`));
        }
        points += size;
    });

    if (comboCount > 1) {
        points += comboCount * 2;
        showToast(`🔥 Комбо x${comboCount}!`, false);
    }

    score += points;
    document.getElementById('score').textContent = score;

    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        if (currentUser) {
            saveHighScore(currentUser, highScore);
        }
    }

    // Проверка прохождения уровня
    if (checkLevelComplete()) {
        isProcessing = false;
        return;
    }

    const cellsToRemoveArray = Array.from(cellsToRemove).map(key => {
        const [r, c] = key.split(',').map(Number);
        return [r, c];
    });

    Animations.remove(cellsToRemoveArray, () => {
        cellsToRemove.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            grid[r][c] = -1;
        });

        bonusMap.forEach((type, key) => {
            const [r, c] = key.split(',').map(Number);
            grid[r][c] = type;
            Animations.bonus(r, c, type);
        });

        setTimeout(() => {
            dropDown();
            renderGrid();
            const rows = [], cols = [];
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (grid[r][c] !== -1) {
                        rows.push(r);
                        cols.push(c);
                    }
                }
            }
            Animations.drop(rows, cols, () => {
                setTimeout(() => {
                    if (hasMatches()) {
                        processMatches();
                    } else {
                        isProcessing = false;
                        selected = null;
                        checkGameOver();
                    }
                }, 200);
            });
        }, 200);
    });
}

// ---- ПРОВЕРКА ХОДОВ (ЕСЛИ НЕТ ХОДОВ - ПЕРЕМЕШИВАЕМ) ----
function checkGameOver() {
    // Проверяем, не закончились ли ходы
    if (moves >= maxMoves && !levelCompleted) {
        showToast('💀 Ходы закончились! Попробуй ещё раз.', true);
        setTimeout(() => {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('menuContainer').style.display = 'block';
            updateMenuUI();
            updateLevelDisplay();
        }, 1500);
        return;
    }
    
    // Проверяем возможные ходы
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
                        return;
                    }
                    grid[ni][nj] = grid[i][j];
                    grid[i][j] = temp;
                }
            }
        }
    }
    // Нет ходов — перемешиваем
    showToast('🔄 Перемешивание...', false);
    setTimeout(() => {
        const flat = [];
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] === 'number') flat.push(grid[i][j]);
            }
        }
        for (let i = flat.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flat[i], flat[j]] = [flat[j], flat[i]];
        }
        let idx = 0;
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] === 'number') {
                    grid[i][j] = flat[idx++];
                }
            }
        }
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] !== 'number') grid[i][j] = Math.floor(Math.random() * EMOJIS.length);
            }
        }
        renderGrid();
        isProcessing = false;
        selected = null;
        showToast('🔄 Перемешано!', false);
    }, 600);
}

// ---- ПРОВЕРКА МОЖНЫХ ХОДОВ (ПОДСКАЗКА) ----
function hasPossibleMoves() {
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
                        return true;
                    }
                    grid[ni][nj] = grid[i][j];
                    grid[i][j] = temp;
                }
            }
        }
    }
    return false;
}

console.log('🎮 game.js (с уровнями) загружен!');
