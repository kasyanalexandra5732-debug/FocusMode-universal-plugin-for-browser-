// background.js - ПОЛНАЯ ЧИСТАЯ ВЕРСИЯ
const FOCUS_ALARM = "focusTimer";
const BADGE_ALARM = "badgeUpdater";

// 1. Функция управления блокировкой (declarativeNetRequest)
async function setBlocking(isEnabled, sites = []) {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = currentRules.map(rule => rule.id);

    if (isEnabled && sites.length > 0) {
        const newRules = sites.map((domain, index) => {
            const cleanDomain = domain.replace(/(^\w+:|^)\/\//, '').replace(/\/.*$/, '');
            return {
                id: index + 1,
                priority: 1,
                action: { type: "block" },
                condition: { 
                    urlFilter: `*://${cleanDomain}/*`, 
                    resourceTypes: ["main_frame"] 
                }
            };
        });

        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds,
            addRules: newRules
        });
    } else {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });
    }
}

// 2. Функция обновления текста на иконке
async function updateBadge() {
    const data = await chrome.storage.local.get(['endTime', 'isActive']);
    if (data.isActive && data.endTime) {
        const remaining = Math.max(0, Math.ceil((data.endTime - Date.now()) / 60000));
        chrome.action.setBadgeText({ text: remaining > 0 ? remaining.toString() : "" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF4500" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

// 3. Слушатель сообщений (Взаимодействие с Popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startFocus") {
        const durationMin = parseFloat(request.minutes) || 25;
        const endTime = Date.now() + (durationMin * 60000);

        chrome.storage.local.set({ 
            isActive: true, 
            endTime: endTime, 
            blockedSites: request.sites 
        }, () => {
            chrome.alarms.create(FOCUS_ALARM, { delayInMinutes: durationMin });
            chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 });
            setBlocking(true, request.sites);
            updateBadge();
        });
    }

    if (request.action === "stopFocus") {
        chrome.alarms.clearAll();
        setBlocking(false);
        chrome.storage.local.set({ isActive: false, endTime: 0 }, updateBadge);
    }
});

// 4. Слушатель будильников (Таймер завершен или Badge обновился)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === FOCUS_ALARM) {
        setBlocking(false);
        chrome.storage.local.set({ isActive: false, endTime: 0 }, () => {
            updateBadge();
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon128.png",
                title: "Focus Mode",
                message: "Таймер завершен! Сайты разблокированы."
            });
        });
    } else if (alarm.name === BADGE_ALARM) {
        updateBadge();
    }
});

// 5. Восстановление при запуске браузера
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['isActive', 'endTime', 'blockedSites'], (data) => {
        if (data.isActive && data.endTime > Date.now()) {
            const remainingMin = (data.endTime - Date.now()) / 60000;
            chrome.alarms.create(FOCUS_ALARM, { delayInMinutes: remainingMin });
            chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 });
            setBlocking(true, data.blockedSites);
        } else {
            chrome.storage.local.set({ isActive: false });
            setBlocking(false);
        }
    });
});

console.log("Service Worker: Active and Clean.");

async function setBlocking(isEnabled, sites = []) {
    // 1. Сначала всегда полностью очищаем старые динамические правила
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = currentRules.map(rule => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });

    if (isEnabled && sites.length > 0) {
        // 2. Формируем новые правила
        const newRules = sites.map((domain, index) => {
            // Очистка: убираем http://, https://, www. и всё после слеша
            let cleanDomain = domain.toLowerCase()
                .replace(/(^\w+:|^)\/\//, '') // убирает протокол
                .replace(/^www\./, '')        // убирает www
                .split('/')[0];               // берет только домен

            return {
                id: index + 1,
                priority: 1,
                action: { type: "block" },
                condition: { 
                    // Фильтр * позволяет блокировать и поддомены, и любые пути
                    urlFilter: `*${cleanDomain}*`, 
                    resourceTypes: ["main_frame", "sub_frame"] 
                }
            };
        });

        // 3. Применяем новые правила
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules
        });
        console.log("Блокировка активирована для:", sites);
    }
}