// ================================================================
//  bonuses.js — ВСЕ БОНУСЫ (КАК В GARDENSCAPES)
// ================================================================

const BONUS_TYPES = {
    ROCKET: 'rocket',      // 💥 — взрывает ряд
    BOMB: 'bomb',          // 💣 — взрывает вокруг
    RAINBOW: 'rainbow',    // 🌈 — удаляет все одного типа
    DOUBLE: 'double'       // ⚡ — удваивает очки за комбинацию
};

// ---- АКТИВАЦИЯ БОНУСА ----
function activateBonus(row, col) {
    const bonus = grid[row][col];
    
    if (bonus === BONUS_TYPES.ROCKET) {
        showToast('💥 Ракета!', false);
        Animations.bonusActivation(row, col, 'rocket', () => {
            // Взрываем горизонтально
            for (let i = 0; i < SIZE; i++) {
                if (typeof grid[row][i] === 'number') {
                    grid[row][i] = -1;
                    score += 2;
                }
            }
            grid[row][col] = -1;
            document.getElementById('score').textContent = score;
            afterBonus();
        });
    } else if (bonus === BONUS_TYPES.BOMB) {
        showToast('💣 Бомба!', false);
        Animations.bonusActivation(row, col, 'bomb', () => {
            // Взрываем вокруг (радиус 2)
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
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
    } else if (bonus === BONUS_TYPES.RAINBOW) {
        showToast('🌈 Радуга!', false);
        Animations.bonusActivation(row, col, 'rainbow', () => {
            // Удаляем все элементы одного типа
            const targetType = grid[row][col] === BONUS_TYPES.RAINBOW ? 
                Math.floor(Math.random() * EMOJIS.length) : 
                grid[row][col];
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE; j++) {
                    if (grid[i][j] === targetType) {
                        grid[i][j] = -1;
                        score += 3;
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

// ---- СОЗДАНИЕ БОНУСА НА ПОЛЕ ----
function createBonus(row, col, type) {
    grid[row][col] = type;
    const cell = getCellElement(row, col);
    if (cell) {
        if (type === BONUS_TYPES.ROCKET) {
            cell.textContent = '💥';
            cell.classList.add('bonus-rocket');
        } else if (type === BONUS_TYPES.BOMB) {
            cell.textContent = '💣';
            cell.classList.add('bonus-bomb');
        } else if (type === BONUS_TYPES.RAINBOW) {
            cell.textContent = '🌈';
            cell.classList.add('bonus-rainbow');
        } else if (type === BONUS_TYPES.DOUBLE) {
            cell.textContent = '⚡';
            cell.classList.add('bonus-double');
        }
    }
}

// ---- ПРОВЕРКА КОМБО ----
function checkCombo() {
    if (comboCount > 1) {
        const bonusPoints = comboCount * 3;
        score += bonusPoints;
        document.getElementById('score').textContent = score;
        showToast(`🔥 Комбо x${comboCount}! +${bonusPoints}`, false);
        // Иногда даём бонус за комбо
        if (comboCount >= 3 && Math.random() < 0.3) {
            const emptyCells = [];
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE; j++) {
                    if (grid[i][j] === -1) {
                        emptyCells.push([i, j]);
                    }
                }
            }
            if (emptyCells.length > 0) {
                const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const bonusTypes = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB, BONUS_TYPES.RAINBOW];
                const type = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
                createBonus(r, c, type);
                Animations.bonus(r, c, type);
                showToast(`🎁 Бонус за комбо!`, false);
            }
        }
    }
}

console.log('💥 bonuses.js загружен!');
