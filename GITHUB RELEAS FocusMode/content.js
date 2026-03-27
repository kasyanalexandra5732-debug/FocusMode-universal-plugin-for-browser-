// content/content.js

// 1. Проверяем, что скрипт вообще запустился
console.log("🚀 DataMarker: Content Script успешно внедрен на страницу!");

// 2. Создаем визуальный индикатор (плашку) в углу страницы
function createStatusBadge() {
    const badge = document.createElement('div');
    badge.id = 'dm-status-badge';
    badge.textContent = 'DM Active';
    
    // Стилизуем прямо в JS, чтобы не зависеть от content.css (для теста)
    Object.assign(badge.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        zIndex: '9999',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        opacity: '0.8'
    });

    document.body.appendChild(badge);
}

// Запускаем создание плашки, когда DOM готов
if (document.readyState === 'complete') {
    createStatusBadge();
} else {
    window.addEventListener('load', createStatusBadge);
}

document.addEventListener('click', (e) => {
    if (currentLabel) {
        e.preventDefault();
        e.stopPropagation();

        const clickedText = (e.target.innerText || e.target.alt || "Текст не найден").trim();
        
        // Создаем объект данных
        const newData = {
            text: clickedText.substring(0, 100), // Берем кусочек текста
            label: currentLabel,
            timestamp: new Date().getTime()
        };

        // Сохраняем в хранилище Chrome
		chrome.storage.local.get({ collectedItems: [] }, (result) => {
    const newList = [...result.collectedItems, { text, label, timestamp: new Date().toISOString() }];
    chrome.storage.local.set({ collectedItems: newList });
});
		
        chrome.storage.local.get({ collectedData: [] }, (result) => {
            const updatedData = [...result.collectedData, newData];
            chrome.storage.local.set({ collectedData: updatedData }, () => {
                console.log("Данные сохранены в Storage:", newData);
                
                // Визуальный отклик
                e.target.style.outline = "2px solid #3498db";
                alert(`Размечено как [${currentLabel}]`);
            });
        });

        // Выключаем режим
        currentLabel = null;
        document.body.style.cursor = "default";
    }
}, true);

let currentLabel = null;

// Слушаем команды от Попапа
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startLabeling") {
        currentLabel = request.label;
        document.body.style.cursor = "crosshair"; // Меняем курсор на прицел
        console.log("Режим разметки активирован для:", currentLabel);
    }
});

// Ловим клик по любому элементу
document.addEventListener('click', (e) => {
    if (currentLabel) {
        e.preventDefault(); // Чтобы ссылка не открылась при клике
        e.stopPropagation();

        const clickedText = e.target.innerText || e.target.alt || "Элемент без текста";
        
        console.log(`Размечено как [${currentLabel}]:`, clickedText);
        
        // Подсвечиваем элемент, чтобы было видно, что попали
        const originalBg = e.target.style.backgroundColor;
        e.target.style.backgroundColor = "yellow";
        setTimeout(() => e.target.style.backgroundColor = originalBg, 500);

        // Отключаем режим после одного клика
        currentLabel = null;
        document.body.style.cursor = "default";
        
        alert("Элемент размечен и отправлен в консоль!");
    }
}, true);