// lib/utils.js

/**
 * Пример универсальной функции: форматирование даты
 */
function formatDate(date) {
    return new Date(date).toLocaleString();
}

/**
 * Пример функции для логирования с префиксом расширения
 */
function logInfo(message) {
    console.log(`[DataMarker] ${message}`);
}

// Если нужно что-то специфичное для Chrome API
function getStorageData(key) {
    return chrome.storage.local.get(key);
}