// ================================================================
//  animations.js — ПЛАВНЫЕ АНИМАЦИИ ДЛЯ ТРИ В РЯД
// ================================================================

// ---- КЭШ ЭЛЕМЕНТОВ ----
let gridElements = [];
let animationQueue = [];
let isAnimating = false;

// ---- ПОЛУЧИТЬ КЛЕТКУ ПО КООРДИНАТАМ ----
function getCellElement(row, col) {
    const cells = document.querySelectorAll('.cell');
    for (let cell of cells) {
        if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
            return cell;
        }
    }
    return null;
}

// ---- ПЛАВНЫЙ ОБМЕН КЛЕТОК (СВАП) ----
function animateSwap(r1, c1, r2, c2, callback) {
    const cell1 = getCellElement(r1, c1);
    const cell2 = getCellElement(r2, c2);
    if (!cell1 || !cell2) { if (callback) callback(); return; }

    // Сохраняем содержимое
    const content1 = cell1.innerHTML;
    const content2 = cell2.innerHTML;
    const class1 = cell1.className;
    const class2 = cell2.className;

    // Получаем позиции
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();
    const container = document.getElementById('grid');
    const containerRect = container.getBoundingClientRect();

    // Создаём летающие копии
    const fly1 = document.createElement('div');
    const fly2 = document.createElement('div');

    fly1.className = 'cell fly';
    fly1.innerHTML = content1;
    fly1.style.cssText = `
        position: fixed;
        left: ${rect1.left}px;
        top: ${rect1.top}px;
        width: ${rect1.width}px;
        height: ${rect1.height}px;
        font-size: 28px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(30,50,70,0.4);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
        z-index: 100;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    fly2.className = 'cell fly';
    fly2.innerHTML = content2;
    fly2.style.cssText = `
        position: fixed;
        left: ${rect2.left}px;
        top: ${rect2.top}px;
        width: ${rect2.width}px;
        height: ${rect2.height}px;
        font-size: 28px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(30,50,70,0.4);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
        z-index: 100;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    document.body.appendChild(fly1);
    document.body.appendChild(fly2);

    // Скрываем оригиналы
    cell1.style.opacity = '0';
    cell2.style.opacity = '0';

    // Запускаем анимацию через requestAnimationFrame
    requestAnimationFrame(() => {
        const newRect1 = cell2.getBoundingClientRect();
        const newRect2 = cell1.getBoundingClientRect();
        fly1.style.left = newRect1.left + 'px';
        fly1.style.top = newRect1.top + 'px';
        fly1.style.width = newRect1.width + 'px';
        fly1.style.height = newRect1.height + 'px';
        fly2.style.left = newRect2.left + 'px';
        fly2.style.top = newRect2.top + 'px';
        fly2.style.width = newRect2.width + 'px';
        fly2.style.height = newRect2.height + 'px';
    });

    // После анимации
    setTimeout(() => {
        fly1.remove();
        fly2.remove();
        cell1.style.opacity = '1';
        cell2.style.opacity = '1';
        cell1.className = class2;
        cell1.innerHTML = content2;
        cell2.className = class1;
        cell2.innerHTML = content1;
        // Обновляем бонус классы
        if (content1.includes('💥')) cell1.classList.add('bonus-rocket');
        if (content1.includes('💣')) cell1.classList.add('bonus-bomb');
        if (content2.includes('💥')) cell2.classList.add('bonus-rocket');
        if (content2.includes('💣')) cell2.classList.add('bonus-bomb');
        if (callback) callback();
    }, 280);
}

// ---- АНИМАЦИЯ ПАДЕНИЯ КЛЕТОК ----
function animateDrop(rows, cols, callback) {
    let maxDelay = 0;
    const cells = [];

    for (let r of rows) {
        for (let c of cols) {
            const cell = getCellElement(r, c);
            if (!cell) continue;
            const delay = (rows.length - r) * 60;
            if (delay > maxDelay) maxDelay = delay;
            cells.push({ cell, delay });
        }
    }

    // Сортируем по задержке
    cells.sort((a, b) => a.delay - b.delay);

    cells.forEach(({ cell, delay }) => {
        cell.style.transition = 'none';
        cell.style.transform = 'translateY(-40px)';
        cell.style.opacity = '0';
        setTimeout(() => {
            cell.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            cell.style.transform = 'translateY(0)';
            cell.style.opacity = '1';
        }, delay);
    });

    setTimeout(() => {
        if (callback) callback();
    }, maxDelay + 350);
}

// ---- АНИМАЦИЯ УДАЛЕНИЯ КЛЕТОК (С ПАРТИКЛАМИ) ----
function animateRemove(cellsToRemove, callback) {
    const particles = [];
    const container = document.getElementById('grid');
    const containerRect = container.getBoundingClientRect();

    cellsToRemove.forEach(([r, c]) => {
        const cell = getCellElement(r, c);
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        // Создаём частицы
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            const emojis = ['🌟', '✨', '⭐', '💫', '🌈', '🎉'];
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width/2}px;
                top: ${rect.top + rect.height/2}px;
                font-size: ${12 + Math.random() * 16}px;
                pointer-events: none;
                z-index: 99;
                transition: all ${0.5 + Math.random() * 0.5}s cubic-bezier(0.34, 1.56, 0.64, 1);
                opacity: 1;
            `;
            document.body.appendChild(particle);
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 60;
            requestAnimationFrame(() => {
                particle.style.left = (rect.left + rect.width/2 + Math.cos(angle) * dist) + 'px';
                particle.style.top = (rect.top + rect.height/2 + Math.sin(angle) * dist) + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0.3)';
            });
            setTimeout(() => particle.remove(), 1200);
        }
        // Анимация клетки
        cell.style.transition = 'all 0.3s ease';
        cell.style.transform = 'scale(0)';
        cell.style.opacity = '0';
    });

    setTimeout(() => {
        if (callback) callback();
    }, 400);
}

// ---- АНИМАЦИЯ ПОЯВЛЕНИЯ БОНУСА ----
function animateBonus(row, col, type, callback) {
    const cell = getCellElement(row, col);
    if (!cell) { if (callback) callback(); return; }

    cell.style.transition = 'none';
    cell.style.transform = 'scale(0)';
    cell.style.opacity = '0';

    setTimeout(() => {
        cell.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        cell.style.transform = 'scale(1.2)';
        cell.style.opacity = '1';
        // Меняем содержимое на бонус
        if (type === 'rocket') {
            cell.textContent = '💥';
            cell.classList.add('bonus-rocket');
        } else if (type === 'bomb') {
            cell.textContent = '💣';
            cell.classList.add('bonus-bomb');
        }
        setTimeout(() => {
            cell.style.transform = 'scale(1)';
            if (callback) callback();
        }, 400);
    }, 100);
}

// ---- АНИМАЦИЯ АКТИВАЦИИ БОНУСА ----
function animateBonusActivation(row, col, type, callback) {
    const cell = getCellElement(row, col);
    if (!cell) { if (callback) callback(); return; }

    // Взрывная волна
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ffd700'];
        const emojis = ['🔥', '⚡', '💥', '✨', '⭐', '🌟'];
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        const rect = cell.getBoundingClientRect();
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 80;
        particle.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width/2}px;
            top: ${rect.top + rect.height/2}px;
            font-size: ${16 + Math.random() * 24}px;
            pointer-events: none;
            z-index: 99;
            transition: all ${0.5 + Math.random() * 0.5}s ease-out;
            opacity: 1;
        `;
        document.body.appendChild(particle);
        requestAnimationFrame(() => {
            particle.style.left = (rect.left + rect.width/2 + Math.cos(angle) * dist) + 'px';
            particle.style.top = (rect.top + rect.height/2 + Math.sin(angle) * dist) + 'px';
            particle.style.opacity = '0';
            particle.style.transform = 'scale(0.5)';
        });
        setTimeout(() => particle.remove(), 1200);
    }

    // Мигание клетки
    cell.style.transition = 'all 0.1s ease';
    let flashes = 0;
    const flashInterval = setInterval(() => {
        cell.style.opacity = cell.style.opacity === '1' ? '0.3' : '1';
        flashes++;
        if (flashes > 5) {
            clearInterval(flashInterval);
            cell.style.opacity = '1';
            cell.textContent = '';
            cell.className = 'cell';
            if (callback) callback();
        }
    }, 100);
}

// ---- ОБНОВЛЕНИЕ GRID ЭЛЕМЕНТОВ ----
function updateGridElements() {
    gridElements = [];
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (!gridElements[row]) gridElements[row] = [];
        gridElements[row][col] = cell;
    });
}

// ---- ЭКСПОРТ ФУНКЦИЙ ----
window.Animations = {
    swap: animateSwap,
    drop: animateDrop,
    remove: animateRemove,
    bonus: animateBonus,
    bonusActivation: animateBonusActivation,
    updateGrid: updateGridElements,
};

console.log('✨ animations.js загружен!');
