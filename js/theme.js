// ---------- УПРАВЛЕНИЕ ТЕМАМИ ----------
let themeBtn = document.querySelector('.theme');
let themeSwitches = document.querySelectorAll('.theme-element');
let colorBlock = document.querySelector('.color-theme');

function updateActive(index) {
    themeSwitches.forEach(el => el.classList.remove('active-theme'));
    themeSwitches[index]?.classList.add('active-theme');
}

function updateTheme(name, index) {
    const link = document.querySelector('.additionalStyle');
    localStorage.setItem('theme', name);
    localStorage.setItem('theme-index', index);
    if (link) link.href = `css/color-palettes/${name}.css`;
    updateActive(index);

    let event = new Event('changeTheme', {bubbles: true})
    setTimeout(() => {
        link.dispatchEvent(event)
    }, 100)
}

// Инициализация активного класса (без смены CSS – это уже сделано в head)
(function initActive() {
    const savedIndex = localStorage.getItem('theme-index');
    if (savedIndex !== null) {
        updateActive(parseInt(savedIndex));
    } else {
        updateActive(0); // первый по умолчанию
    }
})();

// Открытие/закрытие палитры
themeBtn.addEventListener('click', () => {
    colorBlock.classList.toggle('show');
});

// Закрытие по клику вне
document.addEventListener('click', (e) => {
    if (!colorBlock.contains(e.target) && !themeBtn.contains(e.target) && colorBlock.classList.contains('show')) {
        colorBlock.classList.remove('show');
    }
});

// Обработка выбора темы
themeSwitches.forEach((el, index) => {
    el.addEventListener('click', () => {
        const themeValue = el.dataset.themeName;
        updateTheme(themeValue, index);
    });
});