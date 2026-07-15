// ================================================================
//  ДОБАВЛЯЕМ ПРЕПЯТСТВИЯ В ИГРУ
// ================================================================

// ---- ИНИЦИАЛИЗАЦИЯ С ПРЕПЯТСТВИЯМИ ----
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
    
    // ИНИЦИАЛИЗАЦИЯ ПРЕПЯТСТВИЙ
    Obstacles.init(level);
    
    // Добавляем бонусы
    for (let i = 0; i < Math.min(2, level); i++) {
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (typeof grid[r][c] === 'number' && !Obstacles.has(r, c)) {
            const types = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB];
            createBonus(r, c, types[Math.floor(Math.random() * types.length)]);
        }
    }
}

// ---- ОБНОВЛЁННАЯ РЕНДЕР-ФУНКЦИЯ ----
function renderGrid() {
    const container = document.getElementById('grid');
    container.innerHTML = '';
    const cellSize = container.offsetWidth / SIZE || 40;
    
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            const value = grid[i][j];
            
            // Обычная фишка
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
            
            // Если есть препятствие — добавляем дополнительный слой
            const obs = Obstacles.get(i, j);
            if (obs) {
                const obsData = OBSTACLE_DATA[obs.type];
                const badge = document.createElement('span');
                badge.style.cssText = `
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    font-size: 12px;
                    background: rgba(0,0,0,0.5);
                    border-radius: 50%;
                    padding: 1px 3px;
                    pointer-events: none;
                `;
                badge.textContent = obsData.emoji;
                cell.appendChild(badge);
                
                // Добавляем класс для стилизации
                if (obs.type === 'crystal') cell.style.borderColor = '#6f6fcf';
                if (obs.type === 'lock') cell.style.borderColor = '#cf6f6f';
                if (obs.type === 'ice') cell.style.borderColor = '#6fcfcf';
                if (obs.type === 'box') cell.style.borderColor = '#cf8f6f';
                if (obs.type === 'vine') cell.style.borderColor = '#6fcf6f';
            }
            
            container.appendChild(cell);
        }
    }
    
    Animations.updateGrid();
    updateUI();
}

// ---- ОБНОВЛЁННАЯ ПРОВЕРКА КОМБИНАЦИЙ (С ПРЕПЯТСТВИЯМИ) ----
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
            group.forEach(([r, c]) => cellsToRemove.add(`${r},${c}`);
        }
        points += size;
    });

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

    // ---- УДАЛЕНИЕ С ПРОВЕРКОЙ ПРЕПЯТСТВИЙ ----
    const cellsToRemoveArray = Array.from(cellsToRemove).map(key => {
        const [r, c] = key.split(',').map(Number);
        return [r, c];
    });

    Animations.remove(cellsToRemoveArray, () => {
        cellsToRemove.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            // Проверяем препятствие
            const obs = Obstacles.get(r, c);
            if (obs) {
                // Если есть препятствие — пытаемся его разрушить
                const result = Obstacles.hit(r, c, 'match_near');
                if (result.destroyed) {
                    // Клетка освобождена
                    grid[r][c] = -1;
                }
                // Если не разрушено — клетка остаётся
            } else {
                grid[r][c] = -1;
            }
        });

        bonusMap.forEach((type, key) => {
            const [r, c] = key.split(',').map(Number);
            // Бонусы не ставятся на препятствия
            if (!Obstacles.has(r, c)) {
                createBonus(r, c, type);
                Animations.bonus(r, c, type);
            }
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

// ---- ОБНОВЛЁННАЯ АКТИВАЦИЯ БОНУСОВ С ПРЕПЯТСТВИЯМИ ----
function activateBonus(row, col) {
    const bonus = grid[row][col];
    
    if (bonus === BONUS_TYPES.ROCKET) {
        showToast('💥 Ракета!', false);
        Animations.bonusActivation(row, col, 'rocket', () => {
            // Горизонтальный взрыв
            for (let i = 0; i < SIZE; i++) {
                if (typeof grid[row][i] === 'number') {
                    grid[row][i] = -1;
                    score += 2;
                }
                // Удаляем препятствия (кроме кристалла и замка)
                Obstacles.removeByRocket(row, i, 'horizontal');
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    } else if (bonus === BONUS_TYPES.BOMB) {
        showToast('💣 Бомба!', false);
        Animations.bonusActivation(row, col, 'bomb', () => {
            // Взрыв вокруг (удаляет ВСЕ препятствия)
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    const nr = row + i, nc = col + j;
                    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                        if (typeof grid[nr][nc] === 'number') {
                            grid[nr][nc] = -1;
                            score += 1;
                        }
                        // Бомба удаляет ЛЮБЫЕ препятствия
                        Obstacles.removeByBomb(nr, nc, 0);
                    }
                }
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    } else if (bonus === BONUS_TYPES.RAINBOW) {
        showToast('🌈 Радуга!', false);
        Animations.bonusActivation(row, col, 'rainbow', () => {
            const targetType = Math.floor(Math.random() * EMOJIS.length);
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE; j++) {
                    if (grid[i][j] === targetType) {
                        grid[i][j] = -1;
                        score += 3;
                        // Радуга удаляет препятствия на этих клетках
                        Obstacles.removeByBomb(i, j, 0);
                    }
                }
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    } else if (bonus === BONUS_TYPES.DOUBLE) {
        showToast('⚡ Двойные очки!', false);
        Animations.bonusActivation(row, col, 'double', () => {
            score += 10;
            document.getElementById('score').textContent = score;
            grid[row][col] = -1;
            afterBonus();
        });
    }
}

console.log('🎮 game.js (с препятствиями) загружен!');
