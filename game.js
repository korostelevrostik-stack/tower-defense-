// ================================================================
//  game.js — ОСНОВНАЯ ЛОГИКА ИГРЫ
// ================================================================

let state = {
    money: 50,
    wave: 0,
    lives: 5,
    kills: 0,
    towers: [],
    enemies: [],
    bullets: [],
    particles: [],
    waveActive: false,
    enemySpawnTimer: 0,
    enemiesPerWave: 5,
    enemiesSpawned: 0,
    waveCooldown: 0,
    towerType: 0,
    upgradeMode: false,
    sellMode: false,
};

const TOWER_TYPES = [
    { name: 'Лучник', emoji: '🏹', cost: 20, damage: 1, range: 100, fireRate: 25, color: '#6fcf6f', upgradeCost: 15 },
    { name: 'Маг', emoji: '🔮', cost: 35, damage: 2, range: 80, fireRate: 35, color: '#6f6fcf', upgradeCost: 25 },
    { name: 'Пушка', emoji: '💥', cost: 50, damage: 4, range: 60, fireRate: 45, color: '#cf6f6f', upgradeCost: 35 },
    { name: 'Ледяная', emoji: '❄️', cost: 70, damage: 1, range: 90, fireRate: 30, color: '#6fcfcf', upgradeCost: 40 },
];

let canvas, ctx, width, height;
let gameRunning = false;
let gameOver = false;
let frameCount = 0;
const CELL_SIZE = 40;

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
}

function startGame() {
    const user = getCurrentUser();
    if (!user) { showAuthScreen('login'); return; }

    const userState = getGameState(user);
    state.money = userState?.money || 50;
    state.wave = 0;
    state.lives = 5;
    state.kills = 0;
    state.towers = [];
    state.enemies = [];
    state.bullets = [];
    state.particles = [];
    state.waveActive = false;
    state.enemySpawnTimer = 0;
    state.enemiesPerWave = 5;
    state.enemiesSpawned = 0;
    state.waveCooldown = 0;
    state.upgradeMode = false;
    state.sellMode = false;
    gameRunning = true;
    gameOver = false;
    frameCount = 0;

    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('upgradeBtn').style.borderColor = '#2a4a5a';
    document.getElementById('sellBtn').style.borderColor = '#2a4a5a';
    document.getElementById('statusMsg').textContent = '🏰 Нажми на поле, чтобы поставить башню!';
    updateUI();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;
    frameCount++;
    updateGame();
    drawGame();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function updateGame() {
    // Башни
    for (let t of state.towers) {
        if (t.cooldown > 0) t.cooldown--;

        let closest = null;
        let closestDist = Infinity;
        for (let e of state.enemies) {
            const dx = e.x - t.x;
            const dy = e.y - t.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < t.range && dist < closestDist) {
                closest = e;
                closestDist = dist;
            }
        }
        t.target = closest;

        if (t.target && t.cooldown === 0) {
            t.cooldown = t.fireRate;
            const type = TOWER_TYPES[t.type];
            let isIce = type.name === 'Ледяная';
            state.bullets.push({
                x: t.x,
                y: t.y,
                target: t.target,
                speed: 5,
                damage: t.damage,
                size: 4,
                color: isIce ? '#6fcfcf' : '#ffd700',
                isIce: isIce,
            });
        }
    }

    // Пули
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        if (!b.target || b.target.hp <= 0) {
            state.bullets.splice(i, 1);
            continue;
        }
        const dx = b.target.x - b.x;
        const dy = b.target.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b.speed + b.target.size) {
            b.target.hp -= b.damage;
            if (b.isIce) {
                b.target.speed = Math.max(0.3, b.target.speed * 0.5);
                b.target.slowTimer = 30;
            }
            for (let p = 0; p < 5; p++) {
                state.particles.push({
                    x: b.target.x,
                    y: b.target.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 20 + Math.random() * 20,
                    size: 2 + Math.random() * 3,
                    color: b.color,
                });
            }
            if (b.target.hp <= 0) {
                state.kills++;
                state.money += b.target.value;
                const user = getCurrentUser();
                if (user) {
                    const gs = getGameState(user);
                    gs.totalKills = (gs.totalKills || 0) + 1;
                    gs.money = state.money;
                    saveGameState(user, gs);
                }
                const idx = state.enemies.indexOf(b.target);
                if (idx > -1) state.enemies.splice(idx, 1);
                for (let p = 0; p < 10; p++) {
                    state.particles.push({
                        x: b.target.x,
                        y: b.target.y,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 15 + Math.random() * 20,
                        size: 2 + Math.random() * 4,
                        color: '#ffd700',
                    });
                }
            }
            state.bullets.splice(i, 1);
        } else {
            b.x += (dx / dist) * b.speed;
            b.y += (dy / dist) * b.speed;
        }
    }

    // Враги
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        if (e.slowTimer > 0) e.slowTimer--;
        let speed = e.speed;
        if (e.slowTimer > 0) speed *= 0.6;
        e.x += speed;

        if (e.type === 'healer') {
            e.healTimer--;
            if (e.healTimer <= 0) {
                e.healTimer = 30;
                for (let other of state.enemies) {
                    if (other !== e && other.hp < other.maxHp) {
                        other.hp = Math.min(other.maxHp, other.hp + 1);
                    }
                }
            }
        }

        if (e.x > width + 20) {
            state.lives--;
            state.enemies.splice(i, 1);
            if (state.lives <= 0) {
                endGame(false);
                return;
            }
            updateUI();
        }
    }

    // Спавн врагов
    if (state.waveActive) {
        state.enemySpawnTimer--;
        if (state.enemySpawnTimer <= 0) {
            spawnEnemy();
            state.enemySpawnTimer = Math.max(10, 35 - state.wave * 1.5);
        }
    }

    if (!state.waveActive && state.waveCooldown > 0) {
        state.waveCooldown--;
        if (state.waveCooldown === 0) {
            startWave();
        }
    }

    // Частицы
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    updateUI();
}

function spawnEnemy() {
    if (!state.waveActive) return;
    if (state.enemiesSpawned >= state.enemiesPerWave) {
        if (state.enemies.length === 0) {
            state.waveActive = false;
            state.waveCooldown = 50;
            const user = getCurrentUser();
            if (user) {
                const gs = getGameState(user);
                if (state.wave > gs.maxWaves) {
                    gs.maxWaves = state.wave;
                }
                gs.money = state.money;
                saveGameState(user, gs);
            }
            const bonus = 10 + state.wave * 2;
            state.money += bonus;
            document.getElementById('statusMsg').textContent = `🌊 Волна ${state.wave} пройдена! +${bonus}💰`;
            showToast(`💰 +${bonus} за волну!`, false);
            updateUI();
        }
        return;
    }

    let type = 'normal';
    let size = 12 + Math.random() * 6;
    let hp = 2 + state.wave;
    let speed = 0.5 + state.wave * 0.06;
    let value = 2 + Math.floor(state.wave / 2);
    let color = '#6fcf6f';

    const r = Math.random();
    if (state.wave > 3 && r < 0.2) {
        type = 'fast';
        size = 10;
        hp = 1 + Math.floor(state.wave / 2);
        speed = 1.5 + state.wave * 0.1;
        value = 3 + Math.floor(state.wave / 2);
        color = '#ff6b6b';
    } else if (state.wave > 5 && r < 0.15) {
        type = 'tank';
        size = 22;
        hp = 5 + state.wave * 2;
        speed = 0.3 + state.wave * 0.03;
        value = 5 + state.wave;
        color = '#6b6bcf';
    } else if (state.wave > 8 && r < 0.1) {
        type = 'healer';
        size = 14;
        hp = 3 + state.wave;
        speed = 0.4 + state.wave * 0.04;
        value = 4 + state.wave;
        color = '#6fcfcf';
    }

    state.enemies.push({
        x: -size,
        y: Math.random() * (height - 40) + 20,
        size: size,
        hp: hp,
        maxHp: hp,
        speed: Math.min(speed, 3.5),
        value: value,
        type: type,
        color: color,
        healTimer: 0,
        slowTimer: 0,
    });
    state.enemiesSpawned++;
}

function buildTower(x, y) {
    const type = TOWER_TYPES[state.towerType];
    if (state.money < type.cost) {
        showToast('⚠️ Не хватает денег!', true);
        return false;
    }
    const cx = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    const cy = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    for (let t of state.towers) {
        if (Math.abs(t.x - cx) < CELL_SIZE && Math.abs(t.y - cy) < CELL_SIZE) {
            showToast('⚠️ Здесь уже есть башня!', true);
            return false;
        }
    }
    state.money -= type.cost;
    state.towers.push({
        x: cx,
        y: cy,
        type: state.towerType,
        level: 1,
        damage: type.damage,
        range: type.range,
        fireRate: type.fireRate,
        cooldown: 0,
        target: null,
        emoji: type.emoji,
        color: type.color,
        name: type.name,
    });
    const user = getCurrentUser();
    if (user) {
        const gs = getGameState(user);
        gs.money = state.money;
        saveGameState(user, gs);
    }
    updateUI();
    showToast(`✅ ${type.name} построена!`, false);
    return true;
}

function upgradeTower(x, y) {
    let found = false;
    for (let t of state.towers) {
        if (Math.abs(t.x - x) < CELL_SIZE && Math.abs(t.y - y) < CELL_SIZE) {
            const type = TOWER_TYPES[t.type];
            const cost = type.upgradeCost + t.level * 5;
            if (state.money < cost) {
                showToast(`⚠️ Нужно ${cost}💰!`, true);
                return false;
            }
            if (t.level >= 5) {
                showToast('⚠️ Максимальный уровень!', true);
                return false;
            }
            state.money -= cost;
            t.level++;
            t.damage = type.damage + t.level * 0.5;
            t.range = type.range + t.level * 8;
            t.fireRate = Math.max(12, type.fireRate - t.level * 2);
            found = true;
            const user = getCurrentUser();
            if (user) {
                const gs = getGameState(user);
                gs.money = state.money;
                saveGameState(user, gs);
            }
            updateUI();
            showToast(`⬆️ ${type.name} улучшена до ${t.level} уровня!`, false);
            break;
        }
    }
    if (!found) showToast('⚠️ Нажми на башню!', true);
    return found;
}

function sellTower(x, y) {
    let found = false;
    for (let i = state.towers.length - 1; i >= 0; i--) {
        const t = state.towers[i];
        if (Math.abs(t.x - x) < CELL_SIZE && Math.abs(t.y - y) < CELL_SIZE) {
            const type = TOWER_TYPES[t.type];
            const sellValue = Math.floor(type.cost / 2) + t.level * 3;
            state.money += sellValue;
            state.towers.splice(i, 1);
            found = true;
            const user = getCurrentUser();
            if (user) {
                const gs = getGameState(user);
                gs.money = state.money;
                saveGameState(user, gs);
            }
            updateUI();
            showToast(`💰 Башня продана за ${sellValue}💰!`, false);
            break;
        }
    }
    if (!found) showToast('⚠️ Нажми на башню!', true);
    return found;
}

function updateUI() {
    document.getElementById('money').textContent = Math.floor(state.money);
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('lives').textContent = state.lives;
    document.getElementById('kills').textContent = state.kills;

    document.querySelectorAll('.tower-btn').forEach((btn, i) => {
        const type = TOWER_TYPES[i];
        btn.classList.toggle('active', state.towerType === i);
        btn.querySelector('.tprice').textContent = `${type.cost}💰`;
    });
}

function endGame(win) {
    if (gameOver) return;
    gameOver = true;
    gameRunning = false;
    const overlay = document.getElementById('gameOver');
    overlay.classList.add('active');

    const goText = document.getElementById('goText');
    if (win) {
        goText.textContent = '🏆 ПОБЕДА!';
        goText.className = 'go-text win';
        const bonus = 50 + state.wave * 5;
        state.money += bonus;
        showToast(`🏆 Победа! +${bonus}💰!`, false);
    } else {
        goText.textContent = '💀 ПОРАЖЕНИЕ';
        goText.className = 'go-text';
        const bonus = Math.floor(state.money / 3);
        state.money += bonus;
        showToast(`💀 +${bonus}💰 утешительный приз`, false);
    }

    document.getElementById('goMoney').textContent = Math.floor(state.money);
    document.getElementById('goWaves').textContent = state.wave;
    document.getElementById('goKills').textContent = state.kills;

    const user = getCurrentUser();
    if (user) {
        const gs = getGameState(user);
        gs.money = state.money;
        if (state.wave > gs.maxWaves) gs.maxWaves = state.wave;
        saveGameState(user, gs);
    }
    updateUI();
}

// ---- ОБРАБОТЧИКИ ----
document.getElementById('restartBtn').addEventListener('click', startGame);

document.querySelectorAll('.tower-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        state.towerType = parseInt(this.dataset.tower);
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

document.getElementById('upgradeBtn').addEventListener('click', () => {
    state.upgradeMode = !state.upgradeMode;
    state.sellMode = false;
    document.getElementById('statusMsg').textContent = state.upgradeMode ?
        '⬆️ Нажми на башню, чтобы улучшить' :
        '🏰 Режим улучшения отключён';
    document.getElementById('upgradeBtn').style.borderColor = state.upgradeMode ? '#ffd700' : '#2a4a5a';
    document.getElementById('sellBtn').style.borderColor = '#2a4a5a';
});

document.getElementById('sellBtn').addEventListener('click', () => {
    state.sellMode = !state.sellMode;
    state.upgradeMode = false;
    document.getElementById('statusMsg').textContent = state.sellMode ?
        '💰 Нажми на башню, чтобы продать' :
        '🏰 Режим продажи отключён';
    document.getElementById('sellBtn').style.borderColor = state.sellMode ? '#ff6b6b' : '#2a4a5a';
    document.getElementById('upgradeBtn').style.borderColor = '#2a4a5a';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Сбросить прогресс?')) return;
    const user = getCurrentUser();
    if (user) {
        const gs = getGameState(user);
        gs.money = 50;
        gs.maxWaves = 0;
        gs.totalKills = 0;
        saveGameState(user, gs);
    }
    startGame();
    showToast('🔄 Прогресс сброшен!', true);
});

// Клик по полю
canvas = document.getElementById('gameCanvas');
canvas.addEventListener('click', (e) => {
    if (!gameRunning || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (state.upgradeMode) {
        upgradeTower(x, y);
    } else if (state.sellMode) {
        sellTower(x, y);
    } else {
        buildTower(x, y);
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning || gameOver) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    if (state.upgradeMode) {
        upgradeTower(x, y);
    } else if (state.sellMode) {
        sellTower(x, y);
    } else {
        buildTower(x, y);
    }
});

console.log('🎮 game.js загружен!');