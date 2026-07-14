// ================================================================
//  game.js — ЛОГИКА ТРИ В РЯД С АНИМАЦИЯМИ
// ================================================================

let grid = [];
const SIZE = 8;
const EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑'];
let selected = null;
let score = 0;
let moves = 0;
let isProcessing = false;
let currentUser = null;
let highScore = 0;

const BONUS_TYPES = {
    ROCKET: 'rocket',
    BOMB: 'bomb'
};

function initGrid() {
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
            } else if (value === BONUS_TYPES.ROCKET) {
                cell.textContent = '💥';
                cell.classList.add('bonus-rocket');
            } else if (value === BONUS_TYPES.BOMB) {
                cell.textContent = '💣';
                cell.classList.add('bonus-bomb');
            }
            if (selected && selected[0] === i && selected[1] === j) {
                cell.classList.add('selected');
            }
            cell.addEventListener('click', () => onCellClick(i, j));
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                onCellClick(i, j);
            });
            container.appendChild(cell);
        }
    }
    Animations.updateGrid();
    updateUI();
}

function onCellClick(row, col) {
    if (isProcessing) return;
    const val = grid[row][col];
    if (typeof val !== 'number') {
        activateBonus(row, col);
        return;
    }
    if (!selected) {
        selected = [row, col];
        renderGrid();
        return;
    }
    const [sRow, sCol] = selected;
    if (sRow === row && sCol === col) {
        selected = null;
        renderGrid();
        return;
    }
    const dr = Math.abs(sRow - row);
    const dc = Math.abs(sCol - col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        swapAndCheck(sRow, sCol, row, col);
    } else {
        selected = [row, col];
        renderGrid();
    }
}

function swapAndCheck(r1, c1, r2, c2) {
    isProcessing = true;
    // Меняем в данных
    const temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;

    // Плавная анимация обмена
    Animations.swap(r1, c1, r2, c2, () => {
        if (hasMatches()) {
            moves++;
            document.getElementById('moves').textContent = moves;
            processMatches();
        } else {
            // Отмена обмена
            const tempBack = grid[r1][c1];
            grid[r1][c1] = grid[r2][c2];
            grid[r2][c2] = tempBack;
            selected = null;
            renderGrid();
            isProcessing = false;
        }
    });
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

function processMatches() {
    const matches = getMatches();
    if (matches.length === 0) {
        isProcessing = false;
        selected = null;
        return;
    }

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
            group.forEach(([r, c]) => cellsToRemove.add(`${r},${c}`);
        }
        points += size;
    });

    score += points;
    document.getElementById('score').textContent = score;

    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        if (currentUser) {
            const gs = getGameState(currentUser);
            gs.highScore = highScore;
            saveGameState(currentUser, gs);
        }
    }

    // Анимация удаления
    const cellsToRemoveArray = Array.from(cellsToRemove).map(key => {
        const [r, c] = key.split(',').map(Number);
        return [r, c];
    });

    Animations.remove(cellsToRemoveArray, () => {
        // Удаляем из данных
        cellsToRemove.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            grid[r][c] = -1;
        });

        // Ставим бонусы
        bonusMap.forEach((type, key) => {
            const [r, c] = key.split(',').map(Number);
            grid[r][c] = type;
            Animations.bonus(r, c, type);
        });

        // Падение
        setTimeout(() => {
            const changed = dropDown();
            renderGrid();
            // Анимация падения
            const rows = [];
            const cols = [];
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
        }, 300);
    });
}

function dropDown() {
    let changed = false;
    for (let c = 0; c < SIZE; c++) {
        let writeRow = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
            if (grid[r][c] !== -1) {
                grid[writeRow][c] = grid[r][c];
                if (writeRow !== r) {
                    grid[r][c] = -1;
                    changed = true;
                }
                writeRow--;
            }
        }
        for (let r = writeRow; r >= 0; r--) {
            grid[r][c] = Math.floor(Math.random() * EMOJIS.length);
            changed = true;
        }
    }
    return changed;
}

function activateBonus(row, col) {
    const bonus = grid[row][col];
    if (bonus === BONUS_TYPES.ROCKET) {
        showToast('💥 Ракета!', false);
        Animations.bonusActivation(row, col, 'rocket', () => {
            for (let i = 0; i < SIZE; i++) {
                if (typeof grid[row][i] === 'number') {
                    grid[row][i] = -1;
                    score += 1;
                }
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    } else if (bonus === BONUS_TYPES.BOMB) {
        showToast('💣 Бомба!', false);
        Animations.bonusActivation(row, col, 'bomb', () => {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = row + i, nc = col + j;
                    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                        if (typeof grid[nr][nc] === 'number') {
                            grid[nr][nc] = -1;
                            score += 1;
                        }
                    }
                }
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    }
}

function afterBonus() {
    const changed = dropDown();
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
    }, 500);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
    document.getElementById('highScore').textContent = highScore;
    const user = getCurrentUser();
    if (user) document.getElementById('userName').textContent = user;
}

function startGame() {
    const user = getCurrentUser();
    if (!user) { showAuthScreen('login'); return; }
    currentUser = user;
    const gs = getGameState(user);
    highScore = gs?.highScore || 0;
    score = 0;
    moves = 0;
    selected = null;
    isProcessing = false;
    document.getElementById('score').textContent = '0';
    document.getElementById('moves').textContent = '0';
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('userName').textContent = user;
    initGrid();
    renderGrid();
    document.getElementById('statusMsg').textContent = '🍎 Собирай комбинации!';
}

window.showToast = function(msg, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
};

document.getElementById('newGameBtn').addEventListener('click', startGame);
document.getElementById('shuffleBtn').addEventListener('click', () => {
    if (isProcessing) return;
    initGrid();
    renderGrid();
    showToast('🔄 Перемешано!', false);
});

console.log('🎮 game.js загружен!');
