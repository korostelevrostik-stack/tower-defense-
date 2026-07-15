// ================================================================
//  auth.js — ГЕНЕРАТОР МИЛЛИОНА УНИКАЛЬНЫХ ИМЁН
// ================================================================

// ---- БАЗА ДЛЯ ГЕНЕРАЦИИ (БОЛЬШЕ 1000 ВАРИАНТОВ) ----
const NAME_PARTS = {
    // Префиксы (характеристики) — 50 вариантов
    prefixes: [
        'Весёлый', 'Храбрый', 'Мудрый', 'Быстрый', 'Сильный',
        'Смелый', 'Добрый', 'Светлый', 'Тёмный', 'Золотой',
        'Серебряный', 'Огненный', 'Ледяной', 'Громовой', 'Солнечный',
        'Лунный', 'Звёздный', 'Космический', 'Легендарный', 'Бессмертный',
        'Дикий', 'Грозный', 'Яркий', 'Могучий', 'Сказочный',
        'Волшебный', 'Магический', 'Древний', 'Молодой', 'Вечный',
        'Бурный', 'Тихий', 'Громкий', 'Нежный', 'Суровый',
        'Мягкий', 'Твёрдый', 'Гибкий', 'Хитрый', 'Прямой',
        'Честный', 'Щедрый', 'Жадный', 'Щастливый', 'Грустный',
        'Весенний', 'Летний', 'Осенний', 'Зимний', 'Ночной',
        'Дневной', 'Утренний', 'Вечерний', 'Полуночный', 'Рассветный',
        'Закатный', 'Туманный', 'Ясный', 'Дождливый', 'Снежный'
    ],
    // Корни (животные, предметы, явления) — 60 вариантов
    roots: [
        'Петух', 'Волк', 'Лис', 'Орёл', 'Сокол',
        'Тигр', 'Лев', 'Медведь', 'Дракон', 'Феникс',
        'Кит', 'Дельфин', 'Акула', 'Рысь', 'Барс',
        'Грифон', 'Единорог', 'Цербер', 'Пегас', 'Химера',
        'Ворон', 'Сова', 'Ястреб', 'Коршун', 'Сокол',
        'Змея', 'Ящер', 'Крокодил', 'Варан', 'Комодо',
        'Бабочка', 'Стрекоза', 'Жук', 'Паук', 'Скорпион',
        'Меч', 'Щит', 'Копьё', 'Лук', 'Топор',
        'Корона', 'Трон', 'Замок', 'Драгоценность', 'Кристалл',
        'Пламя', 'Молния', 'Ветер', 'Волна', 'Гора',
        'Лес', 'Пустыня', 'Океан', 'Небо', 'Земля',
        'Звезда', 'Луна', 'Солнце', 'Комета', 'Метеор',
        'Галактика', 'Туманность', 'Квазар', 'Пульсар', 'Нейтрон'
    ],
    // Суффиксы (места, состояния) — 50 вариантов
    suffixes: [
        'на закате', 'в рассвете', 'в тумане', 'в грозе', 'в буре',
        'в ночи', 'в дне', 'в тени', 'в свете', 'в пламени',
        'в ледяной мгле', 'в золотой пыли', 'в серебряном дожде', 'в звёздном ветре', 'в лунном сиянии',
        'в солнечном свете', 'в громовом раскате', 'в тишине', 'в шуме волн', 'в ветре',
        'в пустоте', 'в бесконечности', 'в вечности', 'в мгновении', 'в времени',
        'в пространстве', 'в зеркале', 'в тени', 'в свете', 'в темноте',
        'в облаках', 'в тумане', 'в дыму', 'в искрах', 'в пепле',
        'в лесу', 'в горах', 'в пустыне', 'в океане', 'в небе',
        'в звездах', 'в луне', 'в солнце', 'в комете', 'в метеоре',
        'в снегу', 'в дожде', 'в граде', 'в молнии', 'в громе'
    ],
    // Добавляем числа для бесконечных комбинаций
    numbers: ['', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']
};

// ---- ГЕНЕРАЦИЯ ИМЕНИ ----
function generateRandomName() {
    const prefix = NAME_PARTS.prefixes[Math.floor(Math.random() * NAME_PARTS.prefixes.length)];
    const root = NAME_PARTS.roots[Math.floor(Math.random() * NAME_PARTS.roots.length)];
    const suffix = NAME_PARTS.suffixes[Math.floor(Math.random() * NAME_PARTS.suffixes.length)];
    const number = NAME_PARTS.numbers[Math.floor(Math.random() * NAME_PARTS.numbers.length)];
    
    // Иногда добавляем число в конец
    if (Math.random() > 0.3 && number) {
        return `${prefix} ${root} ${suffix} ${number}`;
    }
    return `${prefix} ${root} ${suffix}`;
}

// ---- ПРОВЕРКА, ЗАНЯТО ЛИ ИМЯ ----
function isNameTaken(name, users) {
    return users.hasOwnProperty(name);
}

// ---- ГЕНЕРАЦИЯ УНИКАЛЬНОГО ИМЕНИ ----
function generateUniqueName() {
    const users = getUsers();
    let attempts = 0;
    let name = '';
    do {
        name = generateRandomName();
        attempts++;
    } while (isNameTaken(name, users) && attempts < 1000);
    return name;
}

// ---- ПОДСЧЁТ ВОЗМОЖНЫХ КОМБИНАЦИЙ ----
function countPossibleNames() {
    const prefixes = NAME_PARTS.prefixes.length;
    const roots = NAME_PARTS.roots.length;
    const suffixes = NAME_PARTS.suffixes.length;
    const numbers = NAME_PARTS.numbers.length;
    // Формула: префикс * корень * суффикс * (число или без числа)
    return prefixes * roots * suffixes * (numbers + 1);
}

console.log(`📊 Возможное количество имён: ${countPossibleNames().toLocaleString()}`);

// ---- АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ ----
function autoRegister() {
    const name = generateUniqueName();
    const users = getUsers();
    
    users[name] = {
        highScore: 0,
        gamesPlayed: 0,
        menuState: {
            currentLevel: 1,
            maxLevel: 5,
            stars: 0,
            energy: 5,
            maxEnergy: 5,
            hintCount: 3,
            lastEnergyTime: Date.now(),
            lastDailyReward: Date.now() - 86400000,
        },
        created: Date.now()
    };
    saveUsers(users);
    setCurrentUser(name);
    return name;
}

// ---- ВХОД ИЛИ СОЗДАНИЕ ----
function loginOrRegister() {
    const users = getUsers();
    
    const savedUser = getCurrentUser();
    if (savedUser && users[savedUser]) {
        return savedUser;
    }
    
    const userList = Object.keys(users);
    if (userList.length > 0) {
        const randomUser = userList[Math.floor(Math.random() * userList.length)];
        setCurrentUser(randomUser);
        return randomUser;
    }
    
    const newName = autoRegister();
    return newName;
}

// ---- ПОЛУЧИТЬ ИМЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ----
function getOrCreateUser() {
    const user = getCurrentUser();
    if (user) {
        const users = getUsers();
        if (users[user]) {
            return user;
        }
    }
    return loginOrRegister();
}

// ---- ПОКАЗАТЬ ВСЕ ИМЕНА (ДЛЯ ТЕСТА) ----
function showRandomNames(count = 10) {
    const names = [];
    for (let i = 0; i < count; i++) {
        names.push(generateRandomName());
    }
    console.log('🎲 Случайные имена:', names);
    return names;
}

// ---- ПЕРЕОПРЕДЕЛЯЕМ showAuthScreen ----
function showAuthScreen() {
    document.getElementById('authOverlay').classList.add('hidden');
    const user = getOrCreateUser();
    document.getElementById('userNameDisplay').textContent = user;
    document.getElementById('userName').textContent = user;
    document.getElementById('menuContainer').style.display = 'flex';
    loadMenu();
    updateLevelDisplay();
    showToast(`👋 Привет, ${user}!`, false);
}

// ---- ОБРАБОТЧИКИ ----
document.getElementById('authSubmitBtn').addEventListener('click', showAuthScreen);
document.getElementById('authToggle').addEventListener('click', showAuthScreen);

// ---- ВЫХОД ----
document.getElementById('backBtn').addEventListener('click', () => {
    if (confirm('Выйти из аккаунта?')) {
        logoutUser();
        document.getElementById('userNameDisplay').textContent = 'Гость';
        document.getElementById('userName').textContent = 'Гость';
        document.getElementById('menuContainer').style.display = 'none';
        document.getElementById('authOverlay').classList.remove('hidden');
        document.getElementById('authTitle').textContent = '🍎 Нажми "Войти"';
        document.getElementById('authSubmitBtn').textContent = '🎮 Войти в игру';
        document.getElementById('authExtraFields').innerHTML = '';
        document.getElementById('authToggle').textContent = '';
    }
});

// ---- ВЫВОД ИНФОРМАЦИИ ----
console.log('🔐 auth.js (генератор имён) загружен!');
console.log(`📊 Возможных имён: ${countPossibleNames().toLocaleString()}`);
console.log('🎲 Примеры имён:', showRandomNames(5).join(', '));

// ---- ЭКСПОРТ ДЛЯ ТЕСТОВ ----
window.TestNames = {
    generate: generateRandomName,
    generateUnique: generateUniqueName,
    show: showRandomNames,
    count: countPossibleNames
};
