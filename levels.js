// ================================================================
//  levels.js — УРОВНИ (КАК В GARDENSCAPES)
// ================================================================

const LEVEL_CONFIGS = {
    1: { size: 8, types: 5, moves: 20, target: 30, name: '🌱 Начало' },
    2: { size: 8, types: 5, moves: 22, target: 40, name: '🌿 Росток' },
    3: { size: 8, types: 6, moves: 25, target: 50, name: '🌻 Цветок' },
    4: { size: 8, types: 6, moves: 28, target: 60, name: '🌳 Дерево' },
    5: { size: 8, types: 7, moves: 30, target: 75, name: '🏆 Сад' },
    6: { size: 8, types: 7, moves: 32, target: 90, name: '🌺 Рай' },
    7: { size: 9, types: 7, moves: 35, target: 100, name: '✨ Магия' },
    8: { size: 9, types: 8, moves: 38, target: 120, name: '🔥 Огонь' },
    9: { size: 9, types: 8, moves: 40, target: 140, name: '💎 Алмаз' },
    10: { size: 10, types: 8, moves: 45, target: 160, name: '👑 Легенда' },
};

function getLevelConfig(level) {
    return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

function getMaxLevel() {
    return Object.keys(LEVEL_CONFIGS).length;
}

function getLevelStars(score, target) {
    if (score >= target * 2) return 3;
    if (score >= target * 1.3) return 2;
    if (score >= target) return 1;
    return 0;
}

function getNextLevel(currentLevel) {
    const maxLevel = getMaxLevel();
    if (currentLevel < maxLevel) {
        return currentLevel + 1;
    }
    return null;
}

function isLevelComplete(score, target) {
    return score >= target;
}

function getLevelProgress(currentLevel) {
    return Math.min(100, (currentLevel / getMaxLevel()) * 100);
}

console.log('📊 levels.js загружен!');
