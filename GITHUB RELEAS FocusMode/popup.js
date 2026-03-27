document.addEventListener('DOMContentLoaded', () => {
    const siteInput = document.getElementById('siteInput');
    const addBtn = document.getElementById('addBtn');
    const siteList = document.getElementById('siteList');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const minutesInput = document.getElementById('minutes');
    const status = document.getElementById('status');

    let timerInterval;

    // 1. Функция обновления интерфейса таймера
    function updateTimerDisplay() {
        chrome.storage.local.get(['endTime', 'isActive'], (data) => {
            if (data.isActive && data.endTime) {
                const now = Date.now();
                const remainingMs = data.endTime - now;

                if (remainingMs > 0) {
                    const min = Math.floor(remainingMs / 60000);
                    const sec = Math.floor((remainingMs % 60000) / 1000);
                    status.textContent = `Осталось: ${min}:${sec.toString().padStart(2, '0')}`;
                    startBtn.disabled = true; // Блокируем кнопку запуска, пока идет фокус
                } else {
                    stopFocusUI();
                }
            } else {
                stopFocusUI();
            }
        });
    }

    function stopFocusUI() {
        status.textContent = "Статус: Свободен";
        startBtn.disabled = false;
        if (timerInterval) clearInterval(timerInterval);
    }

    // 2. Загрузка списка сайтов и запуск таймера при открытии
    chrome.storage.sync.get(['blockedSites'], (res) => {
        const sites = res.blockedSites || [];
        siteList.innerHTML = '';
        sites.forEach(site => renderSite(site));
    });

    // Запускаем обновление каждую секунду
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);

    // 3. Добавление сайта
    addBtn.addEventListener('click', () => {
        const site = siteInput.value.trim().toLowerCase();
        if (!site) return;

        chrome.storage.sync.get(['blockedSites'], (res) => {
            const sites = res.blockedSites || [];
            if (!sites.includes(site)) {
                sites.push(site);
                chrome.storage.sync.set({ blockedSites: sites }, () => {
                    renderSite(site);
                    siteInput.value = '';
                });
            }
        });
    });

    // 4. Запуск Фокуса
    startBtn.addEventListener('click', () => {
        const mins = parseInt(minutesInput.value) || 25;
        chrome.storage.sync.get(['blockedSites'], (res) => {
            const sites = res.blockedSites || [];
            chrome.runtime.sendMessage({ 
                action: "startFocus", 
                minutes: mins, 
                sites: sites 
            });
            // Небольшая задержка, чтобы background успел обновить storage
            setTimeout(updateTimerDisplay, 100); 
        });
    });

    // 5. Остановка
    stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "stopFocus" });
        setTimeout(updateTimerDisplay, 100);
    });

    function renderSite(site) {
        const li = document.createElement('li');
        li.textContent = site;
        
        // Добавим кнопку удаления для удобства
        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => {
            chrome.storage.sync.get(['blockedSites'], (res) => {
                const sites = res.blockedSites.filter(s => s !== site);
                chrome.storage.sync.set({ blockedSites: sites }, () => {
                    li.remove();
                });
            });
        };
        
        li.appendChild(delBtn);
        siteList.appendChild(li);
    }
});