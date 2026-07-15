// ================================================================
//  drag.js — ПЕРЕТАСКИВАНИЕ ЯЧЕЕК (КАК В GARDENSCAPES)
// ================================================================

let dragData = null;
let dragElement = null;
let dragStartRow = -1;
let dragStartCol = -1;
let dragCurrentRow = -1;
let dragCurrentCol = -1;
let isDragging = false;

// ---- НАЧАЛО ПЕРЕТАСКИВАНИЯ ----
function startDrag(e, row, col) {
    if (isProcessing) return;
    const val = grid[row][col];
    if (typeof val !== 'number') return;
    
    dragStartRow = row;
    dragStartCol = col;
    dragCurrentRow = row;
    dragCurrentCol = col;
    isDragging = true;
    
    const cell = getCellElement(row, col);
    if (cell) {
        cell.classList.add('selected');
        cell.classList.add('dragging');
        dragElement = cell.cloneNode(true);
        dragElement.classList.add('dragging');
        dragElement.style.position = 'fixed';
        dragElement.style.pointerEvents = 'none';
        dragElement.style.zIndex = '100';
        dragElement.style.transform = 'scale(1.1)';
        dragElement.style.boxShadow = '0 0 40px rgba(255,215,0,0.3)';
        document.body.appendChild(dragElement);
        updateDragPosition(e);
    }
}

// ---- ОБНОВЛЕНИЕ ПОЗИЦИИ ПРИ ПЕРЕТАСКИВАНИИ ----
function updateDragPosition(e) {
    if (!dragElement) return;
    let x, y;
    if (e.touches) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }
    dragElement.style.left = (x - 30) + 'px';
    dragElement.style.top = (y - 30) + 'px';
    
    // Определяем, над какой ячейкой находимся
    const container = document.getElementById('grid');
    const rect = container.getBoundingClientRect();
    const cellSize = rect.width / SIZE;
    const col = Math.floor((x - rect.left) / cellSize);
    const row = Math.floor((y - rect.top) / cellSize);
    
    if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
        if (row !== dragCurrentRow || col !== dragCurrentCol) {
            dragCurrentRow = row;
            dragCurrentCol = col;
            highlightDropTarget(row, col);
        }
    }
}

// ---- ПОДСВЕТКА ЦЕЛИ ----
function highlightDropTarget(row, col) {
    // Убираем подсветку с предыдущей
    document.querySelectorAll('.cell.drop-target').forEach(c => c.classList.remove('drop-target'));
    const cell = getCellElement(row, col);
    if (cell) {
        cell.classList.add('drop-target');
        cell.style.borderColor = '#ffd700';
        cell.style.boxShadow = '0 0 30px rgba(255,215,0,0.3)';
    }
}

// ---- ЗАВЕРШЕНИЕ ПЕРЕТАСКИВАНИЯ ----
function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    
    if (dragElement) {
        dragElement.remove();
        dragElement = null;
    }
    
    document.querySelectorAll('.cell.drop-target').forEach(c => {
        c.classList.remove('drop-target');
        c.style.borderColor = '';
        c.style.boxShadow = '';
    });
    
    const cell = getCellElement(dragStartRow, dragStartCol);
    if (cell) {
        cell.classList.remove('selected');
        cell.classList.remove('dragging');
    }
    
    // Проверяем, можно ли сделать обмен
    const dr = Math.abs(dragCurrentRow - dragStartRow);
    const dc = Math.abs(dragCurrentCol - dragStartCol);
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        if (dragCurrentRow >= 0 && dragCurrentRow < SIZE && 
            dragCurrentCol >= 0 && dragCurrentCol < SIZE) {
            swapAndCheck(dragStartRow, dragStartCol, dragCurrentRow, dragCurrentCol);
        }
    }
    
    dragStartRow = -1;
    dragStartCol = -1;
    dragCurrentRow = -1;
    dragCurrentCol = -1;
}

// ---- ОБРАБОТЧИКИ СОБЫТИЙ ----
function setupDragEvents() {
    const container = document.getElementById('grid');
    
    // Touch события
    container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);
        if (cell && cell.classList.contains('cell')) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            startDrag(e, row, col);
        }
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        updateDragPosition(e);
    }, { passive: false });
    
    container.addEventListener('touchend', (e) => {
        endDrag(e);
    }, { passive: true });
    
    // Mouse события
    container.addEventListener('mousedown', (e) => {
        const cell = e.target.closest('.cell');
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            startDrag(e, row, col);
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateDragPosition(e);
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            endDrag(e);
        }
    });
}

console.log('🖱️ drag.js загружен!');
