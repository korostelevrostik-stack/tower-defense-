// ================================================================
//  obstacles.js — 5 ПРЕПЯТСТВИЙ (3 обычных + 2 сложных)
// ================================================================

// ---- ТИПЫ ПРЕПЯТСТВИЙ ----
const OBSTACLE_TYPES = {
    ICE: 'ice',        // ❄️ Лёд — матч рядом
    BOX: 'box',        // 📦 Ящик — 2 удара рядом
    VINE: 'vine',      // 🌿 Лоза — 3 матча рядом
    CRYSTAL: 'crystal', // 💎 Кристалл — ТОЛЬКО БОМБА
    LOCK: 'lock',      // 🔒 Замок — ТОЛЬКО БОМБА + РАКЕТА
};

// ---- ДАННЫЕ О ПРЕПЯТСТВИЯХ ----
const OBSTACLE_DATA = {
    ice: {
        emoji: '❄️',
        name: 'Лёд',
        layers: 1,
        description: 'Замораживает клетку, нужно сделать матч рядом',
        removeMethod: 'match_near',
        color: '#6fcfcf',
        canRemoveWith: ['match_near'],
    },
    box: {
        emoji: '📦',
        name: 'Ящик',
        layers: 2,
        description: 'Блокирует клетку, нужно 2 удара рядом',
        removeMethod: 'hit_near',
        color: '#cf8f6f',
        canRemoveWith: ['hit_near', 'bomb', 'rocket'],
    },
    vine: {
        emoji: '🌿',
        name: 'Лоза',
        layers: 3,
        description: 'Мешает проходу, нужно 3 матча рядом',
        removeMethod: 'match_near',
        color: '#6fcf6f',
        canRemoveWith: ['match_near', 'bomb', 'rocket'],
    },
    crystal: {
        emoji: '💎',
        name: 'Кристалл',
        layers: 1,
        description: 'Неуязвим! Только бомба 💥 может разрушить',
        removeMethod: 'bomb_only',
        color: '#6f6fcf',
        canRemoveWith: ['bomb'],
    },
    lock: {
        emoji: '🔒',
        name: 'Замок',
        layers: 2,
        description: 'Неуязвим! Только бомба + ракета 💥🚀',
        removeMethod: 'bomb_and_rocket',
        color: '#cf6f6f',
        canRemoveWith: ['bomb', 'rocket'],
    },
};

// ---- СОСТОЯНИЕ ПРЕПЯТСТВИЙ ----
let obstacles = [];

// ---- ИНИЦИАЛИЗАЦИЯ ПРЕПЯТСТВИЙ ----
function initObstacles(level) {
    obstacles = [];
    for (let i = 0; i < SIZE; i++) {
        obstacles[i] = [];
        for (let j = 0; j < SIZE; j++) {
            obstacles[i][j] = null;
        }
    }
    
    // Количество препятствий зависит от уровня
    const count = Math.min(4 + Math.floor(level / 2), 12);
    const types = ['ice', 'box', 'vine', 'crystal', 'lock'];
    
    // Распределяем: больше обычных, меньше сложных
    const weights = [40, 25, 20, 10, 5]; // проценты
    
    for (let i = 0; i < count; i++) {
        // Выбираем тип с весами
        let typeIndex = 0;
        let rand = Math.random() * 100;
        let cumulative = 0;
        for (let w = 0; w < weights.length; w++) {
            cumulative += weights[w];
            if (rand <= cumulative) {
                typeIndex = w;
                break;
            }
        }
        const type = types[typeIndex];
        
        // Ищем свободное место
        let row, col;
        let attempts = 0;
        do {
            row = Math.floor(Math.random() * SIZE);
            col = Math.floor(Math.random() * SIZE);
            attempts++;
        } while ((obstacles[row][col] || typeof grid[row][col] !== 'number') && attempts < 100);
        
        if (attempts < 100) {
            obstacles[row][col] = {
                type: type,
                layers: OBSTACLE_DATA[type].layers,
            };
        }
    }
}

// ---- ПРОВЕРКА ПРЕПЯТСТВИЯ ----
function hasObstacle(row, col) {
    return obstacles[row] && obstacles[row][col] !== null;
}

function getObstacle(row, col) {
    if (obstacles[row] && obstacles[row][col]) {
        return obstacles[row][col];
    }
    return null;
}

// ---- УДАР ПО ПРЕПЯТСТВИЮ (ПРИ МАТЧЕ РЯДОМ) ----
function hitObstacle(row, col, hitType) {
    const obs = getObstacle(row, col);
    if (!obs) return { success: false, message: 'Нет препятствия' };
    
    const data = OBSTACLE_DATA[obs.type];
    const canRemove = data.canRemoveWith.includes(hitType);
    
    if (!canRemove) {
        if (obs.type === 'crystal') {
            showToast('💎 Кристалл можно разрушить только бомбой!', true);
        } else if (obs.type === 'lock') {
            showToast('🔒 Замок можно разрушить только бомбой!', true);
        }
        return { success: false, message: 'Не подходит' };
    }
    
    obs.layers--;
    
    if (obs.layers <= 0) {
        obstacles[row][col] = null;
        playSound('bonus');
        showToast(`✅ ${data.name} разрушен!`, false);
        return { success: true, destroyed: true };
    }
    
    playSound('match');
    showToast(`💥 ${data.name}: осталось ${obs.layers} слоёв`, false);
    return { success: true, destroyed: false };
}

// ---- УДАЛЕНИЕ ПРЕПЯТСТВИЙ БОМБОЙ ----
function removeObstaclesByBomb(row, col, radius = 2) {
    const removed = [];
    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            const nr = row + i;
            const nc = col + j;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                const obs = getObstacle(nr, nc);
                if (obs) {
                    obstacles[nr][nc] = null;
                    removed.push({ row: nr, col: nc });
                    // Освобождаем клетку
                    if (grid[nr][nc] === -1) {
                        grid[nr][nc] = Math.floor(Math.random() * EMOJIS.length);
                    }
                }
            }
        }
    }
    return removed;
}

// ---- УДАЛЕНИЕ ПРЕПЯТСТВИЙ РАКЕТОЙ ----
function removeObstaclesByRocket(row, col, direction) {
    const removed = [];
    if (direction === 'horizontal') {
        for (let c = 0; c < SIZE; c++) {
            const obs = getObstacle(row, c);
            if (obs) {
                // Замок и кристалл не убираются ракетой
                if (obs.type === 'crystal' || obs.type === 'lock') continue;
                obstacles[row][c] = null;
                removed.push({ row: row, col: c });
                if (grid[row][c] === -1) {
                    grid[row][c] = Math.floor(Math.random() * EMOJIS.length);
                }
            }
        }
    } else if (direction === 'vertical') {
        for (let r = 0; r < SIZE; r++) {
            const obs = getObstacle(r, col);
            if (obs) {
                if (obs.type === 'crystal' || obs.type === 'lock') continue;
                obstacles[r][col] = null;
                removed.push({ row: r, col: col });
                if (grid[r][col] === -1) {
                    grid[r][col] = Math.floor(Math.random() * EMOJIS.length);
                }
            }
        }
    }
    return removed;
}

// ---- ПРОВЕРКА, МОЖНО ЛИ ОБМЕНЯТЬ КЛЕТКУ ----
function canSwapWithObstacle(row, col) {
    const obs = getObstacle(row, col);
    if (!obs) return true;
    // Лёд можно разморозить, но нельзя переместить
    // Остальные препятствия нельзя переместить
    return false;
}

// ---- РИСОВАНИЕ ПРЕПЯТСТВИЙ ----
function drawObstacles(ctx, cellSize) {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const obs = getObstacle(i, j);
            if (!obs) continue;
            
            const x = j * cellSize + cellSize / 2;
            const y = i * cellSize + cellSize / 2;
            const size = cellSize * 0.5;
            
            // Подложка
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = OBSTACLE_DATA[obs.type].color + '33';
            ctx.beginPath();
            ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Эмодзи
            ctx.font = `${size}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(OBSTACLE_DATA[obs.type].emoji, x, y);
            
            // Количество слоёв
            if (obs.layers > 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '10px sans-serif';
                ctx.fontWeight = 'bold';
                ctx.fillText(`×${obs.layers}`, x + size/2, y - size/2);
            }
        }
    }
}

// ---- ЭКСПОРТ ----
window.Obstacles = {
    init: initObstacles,
    has: hasObstacle,
    get: getObstacle,
    hit: hitObstacle,
    removeByBomb: removeObstaclesByBomb,
    removeByRocket: removeObstaclesByRocket,
    canSwap: canSwapWithObstacle,
    draw: drawObstacles,
    types: OBSTACLE_TYPES,
    data: OBSTACLE_DATA,
};

console.log('🧱 obstacles.js загружен!');
console.log('📋 5 препятствий: ❄️ Лёд, 📦 Ящик, 🌿 Лоза, 💎 Кристалл, 🔒 Замок');
console.log('💎 Кристалл и 🔒 Замок — только бомба!');
