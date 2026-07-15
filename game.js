// ================================================================
//  game.js — ЛОГИКА ИГРЫ (DRAG & DROP + ВСЕ МЕХАНИКИ)
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
let levelCompleted = false;
let targetScore = 30;

function initGridForLevel(level) {
    const config = getLevelConfig(level);
    SIZE = config.size;
    EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑'].slice(0, config.types);
    maxMoves = config.moves;
    targetScore = config.target;
    
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
    // Добавляем начальные бонусы
    for (let i = 0; i < 2; i++) {
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (typeof grid[r][c] === 'number') {
            const types = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB];
            createBonus(r, c, types[Math.floor(Math.random() * types.length)]);
        }
    }
}

function renderGrid() {
    const container = document.getElementById('grid');
    container.innerHTML = '';
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            const value = grid[i][j];
            if (typeof value === 'number') {
                cell.textContent = EMOJIS[value];
                cell.style.background = `rgba(30,50,70,${0.2 + Math.random() * 0.2})`;
            } else if (value === BONUS_TYPES.ROCKET) {
                cell.textContent = '💥';
                cell.classList.add('bonus-rocket');
            } else if (value === BONUS_TYPES.BOMB) {
                cell.textContent = '💣';
                cell.classList.add('bonus-bomb');
            } else if (value === BONUS_TYPES.RAINBOW) {
                cell.textContent = '🌈';
                cell.classList.add('bonus-rainbow');
            } else if (value === BONUS_TYPES.DOUBLE) {
                cell.textContent = '⚡';
                cell.classList.add('bonus-double');
            }
            container.appendChild(cell);
        }
    }
    Animations.updateGrid();
    updateUI();
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
    document.getElementById('gameTitle').textContent = `🎮 ${config.name}`;
    document.getElementById('targetScore').textContent = `🎯 Цель: ${targetScore}`;
    
    initGridForLevel(level);
    renderGrid();
    document.getElementById('statusMsg').textContent = '🍎 Собирай комбинации из 3+ фруктов!';
    
    document.getElementById('menuContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameOver').classList.remove('active');
    
    // Настраиваем drag events
    setupDragEvents();
    
    // Звук начала уровня
    playSound('levelup');
}

function checkLevelComplete() {
    const level = menuState.currentLevel || 1;
    const config = getLevelConfig(level);
    if (score >= config.target && !levelCompleted) {
        levelCompleted = true;
        const stars = getLevelStars(score, config.target);
        menuState.stars += stars;
        menuState.currentLevel = Math.min(menuState.currentLevel + 1, getMaxLevel());
        saveMenuState();
        playSound('levelup');
        showToast(`🎉 Уровень ${level} пройден! ⭐${stars}`, false);
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
    document.getElementById('targetScore').textContent = `🎯 Цель: ${targetScore}`;
}

function processMatches() {
    const matches = getMatches();
    if (matches.length === 0) {
        isProcessing = false;
        selected = null;
        return;
    }

    playSound('match');
    comboCount++;
    let points = 0;
    let bonusMap = new Map();
    const cellsToRemove = new Set();

    matches.forEach(group => {
        const size = group.length;
        if (size >= 4) {
            let bonusType;
            if (size >= 6) bonusType = BONUS_TYPES.BOMB;
            else if (size >= 5) bonusType = BONUS_TYPES.RAINBOW;
            else bonusType = BONUS_TYPES.ROCKET;
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

    // Комбо бонус
    if (comboCount > 1) {
        const bonusPoints = comboCount * 2;
        points += bonusPoints;
        showToast(`🔥 Комбо x${comboCount}! +${bonusPoints}`, false);
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

    if (checkLevelComplete()) {
        isProcessing = false;
        return;
    }

    // Проверка ходов
    if (moves >= maxMoves && !levelCompleted) {
        playSound('fail');
        showToast('💀 Ходы закончились!', true);
        setTimeout(() => {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('menuContainer').style.display = 'block';
            updateMenuUI();
            updateLevelDisplay();
        }, 1500);
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
            createBonus(r, c, type);
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

function dropDown() {
    for (let c = 0; c < SIZE; c++) {
        let writeRow = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
            if (grid[r][c] !== -1) {
                grid[writeRow][c] = grid[r][c];
                if (writeRow !== r) grid[r][c] = -1;
                writeRow--;
            }
        }
        for (let r = writeRow; r >= 0; r--) {
            grid[r][c] = Math.floor(Math.random() * EMOJIS.length);
            // Шанс на бонус
            if (Math.random() < 0.03 && r > 1) {
                const types = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB];
                grid[r][c] = types[Math.floor(Math.random() * types.length)];
            }
        }
    }
}

function checkGameOver() {
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

function hasMatches() {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (isPartOfMatch(i, j)) return true;
        }
    }
    return false;
}

function isPartOfMatch(row, col) {
    const val = grid[row][col];
    if (typeof val !== 'number') return false;
    let count = 1;
    for (let j = col - 1; j >= 0 && grid[row][j] === val; j--) count++;
    for (let j = col + 1; j < SIZE && grid[row][j] === val; j++) count++;
    if (count >= 3) return true;
    count = 1;
    for (let i = row - 1; i >= 0 && grid[i][col] === val; i--) count++;
    for (let i = row + 1; i < SIZE && grid[i][col] === val; i++) count++;
    return count >= 3;
}

function getMatches() {
    const matches = [];
    const checked = new Set();
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (checked.has(`${i},${j}`)) continue;
            const val = grid[i][j];
            if (typeof val !== 'number') continue;
            const group = [];
            let left = j, right = j;
            while (left - 1 >= 0 && grid[i][left - 1] === val) left--;
            while (right + 1 < SIZE && grid[i][right + 1] === val) right++;
            if (right - left + 1 >= 3) {
                for (let c = left; c <= right; c++) { group.push([i, c]); checked.add(`${i},${c}`); }
            }
            let top = i, bottom = i;
            while (top - 1 >= 0 && grid[top - 1][j] === val) top--;
            while (bottom + 1 < SIZE && grid[bottom + 1][j] === val) bottom++;
            if (bottom - top + 1 >= 3) {
                for (let r = top; r <= bottom; r++) {
                    if (!checked.has(`${r},${j}`)) { group.push([r, j]); checked.add(`${r},${j}`); }
                }
            }
            if (group.length > 0) matches.push(group);
        }
    }
    return matches;
}

function afterBonus() {
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
}

// ---- КНОПКИ ----
document.getElementById('newGameBtn').addEventListener('click', () => {
    const level = menuState.currentLevel || 1;
    const config = getLevelConfig(level);
    score = 0;
    moves = 0;
    initGridForLevel(level);
    renderGrid();
    showToast('🔄 Новая игра!', false);
});

document.getElementById('shuffleBtn').addEventListener('click', () => {
    if (isProcessing) return;
    initGridForLevel(menuState.currentLevel || 1);
    renderGrid();
    showToast('🔄 Перемешано!', false);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Сбросить прогресс?')) return;
    const user = getCurrentUser();
    if (user) {
        saveHighScore(user, 0);
        highScore = 0;
        document.getElementById('highScore').textContent = '0';
        showToast('🔄 Прогресс сброшен!', true);
    }
});

console.log('🎮 game.js загружен!');
