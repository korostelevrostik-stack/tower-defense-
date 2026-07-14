// ================================================================
//  draw.js — ОТРИСОВКА ВСЕХ ЭЛЕМЕНТОВ
// ================================================================

function drawGame() {
    ctx.clearRect(0, 0, width, height);

    // Сетка
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Путь врагов
    ctx.fillStyle = 'rgba(255,0,0,0.04)';
    ctx.fillRect(0, height - 6, width, 6);

    // Башни
    for (let t of state.towers) {
        drawTower(t);
    }

    // Враги
    for (let e of state.enemies) {
        drawEnemy(e);
    }

    // Пули
    for (let b of state.bullets) {
        drawBullet(b);
    }

    // Частицы
    for (let p of state.particles) {
        drawParticle(p);
    }

    // Рамка
    ctx.strokeStyle = '#4d8a4d';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
}

function drawTower(t) {
    // Радиус
    ctx.shadowColor = 'rgba(255,215,0,0.08)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(255,215,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // База
    ctx.fillStyle = t.color;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Эмодзи
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.emoji, t.x, t.y - 2);

    // Уровень
    ctx.fillStyle = '#fff';
    ctx.font = '8px sans-serif';
    ctx.fillText(`Lv${t.level}`, t.x, t.y + 20);

    if (t.target) {
        ctx.fillStyle = 'rgba(255,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(t.target.x, t.target.y, t.target.size + 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemy(e) {
    const hpPercent = e.hp / e.maxHp;
    ctx.shadowColor = 'rgba(255,0,0,0.2)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const emojis = { normal: '👾', fast: '💨', tank: '🛡️', healer: '💚' };
    ctx.font = `${e.size + 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[e.type] || '👾', e.x, e.y);

    // HP
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - e.size, e.y - e.size - 6, e.size * 2, 4);
    ctx.fillStyle = hpPercent > 0.6 ? '#6fcf6f' : hpPercent > 0.3 ? '#ffd93d' : '#ff6b6b';
    ctx.fillRect(e.x - e.size, e.y - e.size - 6, e.size * 2 * hpPercent, 4);

    if (e.slowTimer > 0) {
        ctx.fillStyle = 'rgba(106,202,202,0.3)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size + 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBullet(b) {
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawParticle(p) {
    const alpha = p.life / 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

console.log('🎨 draw.js загружен!');